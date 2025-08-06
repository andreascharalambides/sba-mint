import { ChangeDetectorRef, Component, computed, effect, inject, input, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';
import { HubConnection } from '@microsoft/signalr';
import { getState } from '@ngrx/signals';

import { SavedChatsComponent } from '@sinequa/assistant/chat';
import { CCApp, fetchQuery } from '@sinequa/atomic';
import { AggregationComponent, AggregationsStore, AppStore, DrawerStackService, SelectionStore } from '@sinequa/atomic-angular';
import { ButtonComponent, cn, PageHeaderComponent } from '@sinequa/ui';

import { APP_FEATURES } from '../../tokens';
import { AssistantComponent } from '../../components/assistant/assistant';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { AssistantUploadComponent } from './document-upload/assistant-upload.component';
import { AppSidebarComponent } from '../../components/sidebar/sidebar.component';

@Component({
  selector: 'assistant-layout, AssistantLayout',
  imports: [
    TranslocoPipe,
    AssistantComponent,
    SavedChatsComponent,
    AssistantUploadComponent,
    AggregationComponent,
    PageHeaderComponent,
    NavbarComponent,
    ButtonComponent,
    AppSidebarComponent
  ],
  providers: [provideTranslocoScope('filters')],
  templateUrl: './assistant.layout.html',
  styleUrls: ['./assistant.layout.css']
})
export class AssistantLayoutComponent {
  cn = cn;
  chat = viewChild(AssistantComponent);

  drawerStackService = inject(DrawerStackService);
  opened = toSignal(this.drawerStackService.isOpened);

  private readonly appFeatures = inject(APP_FEATURES);
  private readonly appStore = inject(AppStore);
  private readonly aggregationStore = inject(AggregationsStore);
  private readonly selectionStore = inject(SelectionStore);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly instanceId = computed(() => {
    const {
      assistant: { usePrefixName = true }
    } = this.appFeatures;
    if (usePrefixName) {
      const { name } = getState(this.appStore) as CCApp;
      return `${name}-standalone-assistant`;
    }
    return `standalone-assistant`;
  });

  // this is the assistant component who triggers the connection is established
  connectionEstablished = signal(false);

  // this is used to know if the assistant is ready to use (i.e. the assistant is ready to receive queries)
  isAssistantReady = signal(false);

  // this is used to know if the saved chats component should be displayed
  readonly allowSavedChats = computed(() => Boolean(this.appStore.assistants()[this.instanceId()]?.['savedChatSettings']?.['display']));

  // this is used to know if the document uploader component should be displayed
  readonly allowDocumentUploader = computed(() => Boolean(this.appStore.customizationJson()?.['documentsUploadSettings']?.['enabled']));

  // this is used to display the saved chats component
  readonly showSavedChats = computed(() => this.allowSavedChats() && this.connectionEstablished() && this.isAssistantReady());

  // this is used to display the saved chats component
  readonly showDocumentUploader = computed(() => this.allowDocumentUploader() && this.connectionEstablished() && this.isAssistantReady());

  q = input<string>();

  constructor() {
    effect(() => {
      // force the change detection when the AggregationStore is updated.
      // This is needed because we use the ChatComponent which is not a signal component (i.e Angular v14)
      getState(this.aggregationStore);
      this.cdr.detectChanges();
    });

    effect(() => {
      const question = this.q();
      this.chat()?.askAI(question);
    });

    // clear the selection store
    // this is needed to avoid the selection store to be populated with the assistant queries
    this.selectionStore.clear();

    // this is needed to populate the aggregation with the sources as no query is sent to the server
    this.getFirstPageQuery();
  }

  async getFirstPageQuery() {
    const query = this.appStore.getDefaultQuery() || { name: '_default' };
    const response = await fetchQuery({ isFirstPage: true, name: query.name });
    console.log('first page query', response);
    this.aggregationStore.update(response.aggregations);
  }

  handleConnection(connection: HubConnection) {
    // to properly instanciate the saved-chats component, we need to wait for the connection to be established
    if (connection.state === 'Connected') {
      this.connectionEstablished.set(true);
    }
  }

  handleReady(ready: boolean) {
    if (ready) {
      this.isAssistantReady.set(true);
    }
  }
}
