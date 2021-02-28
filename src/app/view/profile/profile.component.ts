import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { ProfileService } from 'src/app/services/profile.service';
import { AuthService } from 'src/app/services/auth.service';
import { ProfileContent } from './profile.content';
import Swal from 'sweetalert2';
import { AdditaionProfileContent } from './additional-profiles/additional-profile.content';
import { FormHelper } from 'src/app/helper/form.helper';
import { RouterHelper } from 'src/app/helper/router.helper';
import { ToastHelper } from 'src/app/helper/toast.helper';
import { ProjectDescription } from './projects/projects.content';
import { BlogService } from 'src/app/services/blog.service';
import { TalkService } from 'src/app/services/talk.service';
import { UserNameValidationError } from './about/about.component';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit, OnDestroy {
  profileContentsObserver: Observable<ProfileContent[]>;
  profileContents: ProfileContent[];
  isEditing: boolean;
  isPage: boolean;
  isLoading: boolean;
  userNameValidationError: UserNameValidationError;
  userEmail: string;
  paramSub: Subscription;
  profileSub: Subscription;
  params: any;
  profileForm: any;
  public newAdditaionProfileContent: AdditaionProfileContent = new AdditaionProfileContent();

  constructor(
    public profileService: ProfileService,
    public blogService: BlogService,
    public talkService: TalkService,
    private toastHelper: ToastHelper,
    public authService: AuthService,
    private route: ActivatedRoute,
    private formHelper: FormHelper,
    public routerHelper: RouterHelper,
  ) {
    this.paramSub = this.route.params.subscribe(params => {
      this.isLoading = true;
      this.isEditing = false;
      this.isPage = true;
      this.params = params;
      this.profileContentsObserver = this.profileService.getProfileContentsObserver({params});
      this.profileSub = this.profileContentsObserver?.subscribe((profileContents) => {
        this.profileContents = profileContents;
        if (this.profileContents.length === 0) {
          const currentUser = this.authService.getCurrentUser();
          this.routerHelper.goToProfile({userName: currentUser?.userName || 'sansoohan'});
        }

        this.profileContents[0].projectsContent.projects.sort((a, b) => {
          if ((a.finishedAt || '9999-99') < (b.finishedAt || '9999-99')) {
            return 1;
          } else if ((a.finishedAt || '9999-99') > (b.finishedAt || '9999-99')) {
            return -1;
          } else {
            if ((a.startedAt || '9999-99') > (b.startedAt || '9999-99')) {
              return 1;
            } else if ((a.startedAt || '9999-99') < (b.startedAt || '9999-99')) {
              return -1;
            } else {
              return 0;
            }
          }
        });

        this.profileForm = this.formHelper.buildFormRecursively(this.profileContents[0]);
        this.isLoading = false;
      });
      if (!this.profileSub) {
        const currentUser = this.authService.getCurrentUser();
        this.routerHelper.goToProfile({userName: currentUser?.userName || 'sansoohan'});
      }
    });
  }

  handleAddAdditionalProfile(){
    this.profileForm?.controls.additaionProfilesContent.push(
      this.formHelper.buildFormRecursively(this.newAdditaionProfileContent)
    );
  }

  handleRemoveAdditionalProfile(index){
    this.toastHelper.askYesNo('Remove Profile Category', 'Are you sure?').then((result) => {
      if (result.value) {
        this.profileForm?.controls.additaionProfilesContent.removeAt(index);
      }
      else if (result.dismiss === Swal.DismissReason.cancel) {
      }
    });
  }

  handleClickEditProfileStart() {
    this.isEditing = true;
  }

  handleClickEditProfileAbort() {
    this.isEditing = false;
  }

  handleValidateUserName(error: UserNameValidationError) {
    this.userNameValidationError = error;
  }

  async handleClickEditProfileUpdate() {
    this.toastHelper.askYesNo('Update Profile', 'Are you sure?').then((result) => {
      if (this.userNameValidationError.hasUserNameCollisionError) {
        this.toastHelper.showError('Upate Fail', 'User URL is already registered.');
        return;
      }

      if (this.userNameValidationError.hasUserNameCharacterError) {
        this.toastHelper.showError('Upate Fail', '(6 to 20 Length of Upper/Lower Alphabet, Number, -, _ can be used for Site Name)');
        return;
      }

      if (result.value) {
        if (this.isEditing) {
          const { userName, ownerId, id } = this.profileForm.value;
          Promise.all([
            this.isUserNameChanged() ? this.blogService.update(
              `blogs/${id}`,
              {userName, ownerId}
            ) : null,
            this.isUserNameChanged() ? this.talkService.update(
              `talks/${id}`,
              {userName, ownerId}
            ) : null,
            this.profileService
            .update(
              `profiles/${id}`,
              this.profileForm.value
            )
          ].filter(Boolean))
          .then(() => {
            this.toastHelper.showSuccess('Profile Update', 'Success!');
            const currentUser = JSON.parse(localStorage.currentUser || null);
            currentUser.userName = this.profileForm.value.userName;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            this.routerHelper.goToProfile({});
          })
          .catch(e => {
            console.error(e);
            this.toastHelper.showWarning('Profile Update Failed.', e);
          });
        }
        this.isEditing = false;
      }
      else if (result.dismiss === Swal.DismissReason.cancel){

      }
    });
  }

  isUserNameChanged() {
    return this.profileForm.value.userName !== this.profileContents[0].userName;
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.paramSub?.unsubscribe();
    this.profileSub?.unsubscribe();
  }
}
