import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectIdeaService } from '../../services/api.service';
import { FriendshipService } from '../../services/friendship.service';
import { AuthService } from '../../auth/auth.service';
import { ChatService } from '../../services/chat.service';
import { E2eeCryptoService } from '../../encryption/e2e-encryption.service';
import { E2eeKeyService } from '../../encryption/e2e-key.service';
import { removeBullet } from '../../utils/text-utils';
import { ProjectProgressService } from '../../services/project.service';

@Component({
  selector: 'app-project-idea-wizard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './project-generator.component.html'
})
export class ProjectIdeaWizardComponent implements OnInit {
  step = 1;
  type: string = '';
  languages: string = '';
  length: string = '';
  ideas: string[] = [];
  loading = false;
  errorMessage = '';
  selectedIdeas: number[] = [];
  friends: any[] = [];
  selectedFriends: string[] = [];
  notificationSent = false;
  removeBullet = removeBullet;

  constructor(
    private projectIdeaService: ProjectIdeaService,
    private friendshipService: FriendshipService,
    private chatService: ChatService,
    private auth: AuthService,
    private e2eeCrypto: E2eeCryptoService,
    private e2eeKey: E2eeKeyService,
    private projectProgress: ProjectProgressService
  ) {}

  ngOnInit() {
    const saved = localStorage.getItem('projectIdeaWizardState');
    if (saved) {
      const state = JSON.parse(saved);
      this.ideas = state.ideas || [];
      this.selectedIdeas = state.selectedIdeas || [];
      this.type = state.type || '';
      this.languages = state.languages || '';
      this.length = state.length || '';
      if (this.ideas.length > 0) {
        this.step = 3;
      }
    }
    // Load friends if user is authenticated
    const username = this.auth.getUsername?.();
    if (username) {
      this.friendshipService.getFriends(username).subscribe(friends => {
        this.friends = friends;
      });
    }
  }

  nextStep() { this.step++; }
  prevStep() { this.step--; }

  toggleSelect(index: number) {
    if (this.selectedIdeas.includes(index)) {
      this.selectedIdeas = this.selectedIdeas.filter(i => i !== index);
    } else if (this.selectedIdeas.length < 2) {
      this.selectedIdeas.push(index);
    }
    this.saveWizardState();
  }

  toggleFriendSelection(username: string) {
    if (this.selectedFriends.includes(username)) {
      this.selectedFriends = this.selectedFriends.filter(u => u !== username);
    } else {
      this.selectedFriends.push(username);
    }
  }

  submit() {
    this.loading = true;
    this.errorMessage = '';
    this.ideas = [];
    this.projectIdeaService.getIdeas({
      type: this.type,
      languages: this.languages,
      length: this.length
    }).subscribe({
      next: ideas => {
        this.ideas = ideas.filter(line =>
          /^(\s*[-*]\s+|\s*\d+\.\s+)/.test(line)
        ).map(line =>
          line.replace(/^(\s*[-*]\s+|\s*\d+\.\s+)/, '')
        );
        this.loading = false;
        this.saveWizardState();
      },
      error: err => {
        this.loading = false;
        if (err.status === 429) {
          this.errorMessage = err.error?.message || 'API quota exceeded. Please try again later.';
        } else {
          this.errorMessage = 'Failed to generate ideas. Please try again.';
        }
      }
    });
  }

  async sendIdeasToFriends() {
    if (this.selectedFriends.length === 0) return;
    const paramsHeader = 
      `Type: ${this.type}\nLanguages: ${this.languages}\nLength: ${this.length} weeks\n`;
    const ideasToSend = paramsHeader + '\n' + this.selectedIdeas.map(i => this.ideas[i]).join('\n\n');
    const sender = this.auth.getUsername();

    for (const friendUsername of this.selectedFriends) {
      try {
        // 1. Get friend's public key
        const publicJwk = await this.e2eeKey.getPublicKey(friendUsername).toPromise();
        if (!publicJwk) continue;
        const publicKey = await this.e2eeCrypto.importPublicKey(publicJwk);

        // 2. Encrypt with hybrid encryption for receiver
        const encryptedContent = await this.e2eeCrypto.hybridEncrypt(ideasToSend, publicKey);

        // 3. Encrypt with hybrid encryption for sender (yourself)
        const senderUsername = this.auth.getUsername();
        if (!senderUsername) continue;
        const ownPublicKey = await this.e2eeKey.getOwnPublicKey(senderUsername);
        const encryptedContentForSender = await this.e2eeCrypto.hybridEncrypt(ideasToSend, ownPublicKey);

        // 4. Send as a chat message
        this.chatService.sendMessage({
          sender,
          receiver: friendUsername,
          contentForReceiver: encryptedContent,
          contentForSender: encryptedContentForSender
        }).subscribe({
          next: () => {},
          error: () => {}
        });

        // 5. Also send project to backend to trigger mail
        this.projectProgress.sendProjectToFriend({
          friend: friendUsername,
          idea: ideasToSend,
          owner: sender!
        }).subscribe({
          next: () => {},
          error: () => {}
        });
      } catch {
        // Silently skip errors
      }
    }
    this.notificationSent = true;
    setTimeout(() => {
      this.notificationSent = false;
      this.selectedFriends = [];
    }, 2000); // 2 seconds
  }

  saveWizardState() {
    const state = {
      ideas: this.ideas,
      selectedIdeas: this.selectedIdeas,
      type: this.type,
      languages: this.languages,
      length: this.length
    };
    localStorage.setItem('projectIdeaWizardState', JSON.stringify(state));
  }

  resetWizard() {
    this.ideas = [];
    this.selectedIdeas = [];
    this.type = '';
    this.languages = '';
    this.length = '';
    localStorage.removeItem('projectIdeaWizardState');
    this.step = 1;
  }
}