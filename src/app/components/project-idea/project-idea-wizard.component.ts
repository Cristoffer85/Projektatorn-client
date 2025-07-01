import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectIdeaService } from '../../services/project.idea.service';
import { FriendshipService } from '../../services/friendship.service';
import { AuthService } from '../../auth/auth.service';
import { ChatService } from '../../services/chat.service';
import { E2eeCryptoService } from '../../services/security/e2eecrypto.service';
import { E2eeKeyService } from '../../services/security/e2eekey.service';

@Component({
  selector: 'app-project-idea-wizard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './project-idea-wizard.component.html'
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

  constructor(
    private projectIdeaService: ProjectIdeaService,
    private friendshipService: FriendshipService,
    private chatService: ChatService,
    private auth: AuthService,
    private e2eeCrypto: E2eeCryptoService,
    private e2eeKey: E2eeKeyService
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

  removeBullet(text: string): string {
    return text.replace(/^([\s\*\-\d\.]+)+/, '').trim();
  }

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
    const ideasToSend = this.selectedIdeas.map(i => this.ideas[i]).join('\n\n');
    const sender = this.auth.getUsername();

    for (const friendUsername of this.selectedFriends) {
      try {
        // 1. Get friend's public key
        const publicJwk = await this.e2eeKey.getPublicKey(friendUsername).toPromise();
        if (!publicJwk) {
          console.error(`No public key found for ${friendUsername}, skipping.`);
          continue;
        }
        const publicKey = await this.e2eeCrypto.importPublicKey(publicJwk);

        // 2. Encrypt with hybrid encryption
        const encryptedContent = await this.e2eeCrypto.hybridEncrypt(ideasToSend, publicKey);

        // 3. Send as a chat message
      this.chatService.sendMessage({
        sender,
        receiver: friendUsername,
        contentForReceiver: encryptedContent, // hybrid-encrypted string
        contentForSender: '' // or you can also encrypt for sender if you want
      }).subscribe({
        next: () => console.log(`Sent to ${friendUsername}`),
        error: err => console.error(`Failed to send to ${friendUsername}:`, err)
      });
      } catch (err) {
        console.error(`Failed to send to ${friendUsername}:`, err);
      }
    }
    this.selectedFriends = [];
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