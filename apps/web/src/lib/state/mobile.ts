/**
 * Mobile View State Management
 *
 * Valtio state for managing mobile workspace views and menu state.
 * Tracks active view (document/chat) and slide-out menu visibility.
 */

import { proxy } from 'valtio';

export type MobileView = 'document' | 'chat';

export interface MobileState {
  /**
   * Currently active view in mobile workspace
   */
  activeView: MobileView;

  /**
   * Whether the slide-out file tree menu is open
   */
  isMenuOpen: boolean;

  /**
   * Whether view transition animation is in progress
   */
  isTransitioning: boolean;
}

/**
 * Mobile workspace state proxy
 */
export const mobileState = proxy<MobileState>({
  activeView: 'document',
  isMenuOpen: false,
  isTransitioning: false,
});

/**
 * Mobile state actions
 */
export const mobileActions = {
  /**
   * Switch to a different view with transition animation
   */
  setActiveView: (view: MobileView) => {
    if (mobileState.activeView === view) return;

    mobileState.isTransitioning = true;
    mobileState.activeView = view;

    // Clear transition flag after animation completes (150ms)
    setTimeout(() => {
      mobileState.isTransitioning = false;
    }, 150);
  },

  /**
   * Toggle the slide-out menu
   */
  toggleMenu: () => {
    mobileState.isMenuOpen = !mobileState.isMenuOpen;
  },

  /**
   * Open the slide-out menu
   */
  openMenu: () => {
    mobileState.isMenuOpen = true;
  },

  /**
   * Close the slide-out menu
   */
  closeMenu: () => {
    mobileState.isMenuOpen = false;
  },

  /**
   * Switch to document view and close menu
   */
  goToDocument: () => {
    mobileActions.setActiveView('document');
    mobileActions.closeMenu();
  },

  /**
   * Switch to chat view and close menu
   */
  goToChat: () => {
    mobileActions.setActiveView('chat');
    mobileActions.closeMenu();
  },
};
