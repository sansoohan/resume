import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AngularFirestore } from '@angular/fire/firestore';
import { TalkContent } from '../../talk.content';
import { TransitionCheckState } from '@angular/material/checkbox';
import { RoomContent } from '../room.content';
import { DataTransferHelper } from 'src/app/helper/data-transfer.helper';
import { RouterHelper } from 'src/app/helper/router.helper';

@Component({
  selector: 'app-talk-room-entrance',
  templateUrl: './entrance.component.html',
  styleUrls: ['./entrance.component.scss']
})
export class EntranceComponent implements OnInit, OnDestroy {
  @Output() clickRemoveRoom: EventEmitter<string|undefined> = new EventEmitter();
  @Input() roomContents?: Array<RoomContent>;

  params: any;
  paramSub: Subscription;
  talkRoomsObserver: any;
  talkRoomsSub?: Subscription;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    public dataTransferHelper: DataTransferHelper,
  ) {
    this.paramSub = this.route.params.subscribe((params) => {
      this.params = params;
    });
  }

  handleClickRemoveRoom(roomId?: string): void {
    this.clickRemoveRoom.emit(roomId);
  }

  goToRoom(roomId: string): void {
    if (!roomId) {
      return;
    }
    this.router.navigate(['/talk', this.params.userName, 'room', roomId]);
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.paramSub?.unsubscribe();
    this.talkRoomsSub?.unsubscribe();
  }
}
