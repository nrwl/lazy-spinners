import {Attribute, Directive, EventEmitter, HostBinding, Input, OnDestroy, OnInit, Optional, Output, SkipSelf} from '@angular/core';
import {Event} from '@angular/router';
import {SpinnerService} from './spinner.service';

@Directive({selector: '[spinner]'})
export class SpinnerDirective implements OnInit, OnDestroy {
  @HostBinding('class.spinning') isSpinning: boolean;

  @Input() spinner: string;

  @Output() activateSpinner = new EventEmitter<Event>();
  @Output() deactivateSpinner = new EventEmitter<Event>();

  constructor(
      private readonly spinnerService: SpinnerService,
      @Optional() @SkipSelf() public readonly parentSpinner: SpinnerDirective) {
  }

  ngOnInit() {
    this.spinnerService.registerSpinner(this);
  }

  ngOnDestroy() {
    this.spinnerService.unregisterSpinner(this);
  }

  activate(e: Event) {
    this.isSpinning = true;
    this.activateSpinner.emit(e);
  }

  deactivate(e: Event) {
    this.isSpinning = false;
    this.deactivateSpinner.emit(e);
  }
}
