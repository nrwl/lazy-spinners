import {UrlTree} from '@angular/router';

/**
 * @whatItDoes analyzes a URL transition to decide if a particular spinner must be invoked.
 */
export interface Matcher {
  /**
   * @whatItDoes represents spinnerId
   */
  readonly spinner: string;

  /**
   * @whatItDoes returns 'true' if the url is matched by the spinner.
   */
  isMatch(url: UrlTree): boolean;

  /**
   * @whatItDoes decides if a spinner should trigger without checking the children
   */
  shouldTrigger(oldUrl: UrlTree, newUrl: UrlTree): boolean;

  /**
   * @whatItDoes decides this spinner or any of the children spinner should trigger.
   */
  containsDifference(oldUrl: UrlTree, newUrl: UrlTree): boolean;
}
