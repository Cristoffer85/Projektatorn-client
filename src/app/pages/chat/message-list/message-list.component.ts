import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-message-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './message-list.component.html'
})
export class MessageListComponent {
  @Input() messages: any[] = [];
  @Input() username: string | null = null;
  @Input() responses: { [messageIndex: number]: { [ideaIndex: number]: boolean|null } } = {};
  @Input() removeBullet!: (text: string) => string;
  @Output() ideaResponse = new EventEmitter<{ message: any, ideaIndex: number, accepted: boolean }>();
  @Output() acceptAndShare = new EventEmitter<any>();

  isOwnMessage(message: any): boolean {
    return message.sender === this.username;
  }

  allIdeasRespondedWithOneYesOneNo(message: any): boolean {
    const msgIdx = this.messages.indexOf(message);
    const resp = this.responses[msgIdx];
    if (!resp) return false;
    const values = Object.values(resp);
    if (values.length !== message.ideas.length) return false;
    const yesCount = values.filter(v => v === true).length;
    const noCount = values.filter(v => v === false).length;
    return yesCount === 1 && noCount === 1;
  }

  onIdeaResponse(message: any, ideaIndex: number, accepted: boolean) {
    this.ideaResponse.emit({ message, ideaIndex, accepted });
  }

  onAcceptAndShare(message: any) {
    this.acceptAndShare.emit(message);
  }
}