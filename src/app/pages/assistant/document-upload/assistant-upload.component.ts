import { Component, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { DocumentUploadComponent, DocumentOverviewComponent, DocumentListComponent } from '@sinequa/assistant/chat';
import { DialogComponent } from '../../../../custom-components/dialog/dialog';
import { DialogContentComponent } from '../../../../custom-components/dialog/dialog-content';
import { DialogTitleComponent } from '../../../../custom-components/dialog/dialog-title';
import { DialogHeaderComponent } from '../../../../custom-components/dialog/dialog-header';
import { DialogFooterComponent } from '../../../../custom-components/dialog/dialog-footer';
import { ButtonComponent } from '@sinequa/ui';

@Component({
  selector: 'assistant-upload, AssistantUpload',
  imports: [
    TranslocoPipe,
    DocumentOverviewComponent,
    DocumentUploadComponent,
    DocumentListComponent,
    ButtonComponent,
    DialogComponent,
    DialogContentComponent,
    DialogTitleComponent,
    DialogHeaderComponent,
    DialogFooterComponent
  ],
  templateUrl: './assistant-upload.component.html',
  styleUrls: ['./assistant-upload.component.css']
})
export class AssistantUploadComponent {
  instanceId = input.required<string>();
  isMenuOpen = false;
  isCollapsed = true;

  toggleMenu(event: Event) {
    event.stopPropagation();
    this.isMenuOpen = !this.isMenuOpen;

    if (this.isMenuOpen) {
      setTimeout(() => {
        document.addEventListener('click', this.closeMenuOnClickOutside);
      });
    } else {
      document.removeEventListener('click', this.closeMenuOnClickOutside);
    }
  }

  closeMenu() {
    this.isMenuOpen = false;
    document.removeEventListener('click', this.closeMenuOnClickOutside);
  }

  private closeMenuOnClickOutside = (event: Event) => {
    const target = event.target as HTMLElement;
    const menuContainer = target.closest('.menu-container');

    if (!menuContainer) {
      this.closeMenu();
    }
  };

  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
  }

  handleDeleteAll(documentListRef: any) {
    if (this.isCollapsed) {
      this.isCollapsed = false;
    }
    documentListRef?.deleteAllDocuments();
    this.closeMenu();
  }

  ngOnDestroy() {
    document.removeEventListener('click', this.closeMenuOnClickOutside);
  }
}
