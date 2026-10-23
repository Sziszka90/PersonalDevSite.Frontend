import { Component, Inject } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'portfolio-modal',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './portfolio-modal.component.html',
  styleUrls: ['./portfolio-modal.component.scss']
})
export class PortfolioModalComponent {
  constructor(
    private dialogRef: MatDialogRef<PortfolioModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { }
  ) {}

  public close() {
    this.dialogRef.close();
  }
}
