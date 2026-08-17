import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KeyboardShortcutHint, ShortcutList, KEYBOARD_SHORTCUTS } from '../KeyboardShortcutHint';

describe('KeyboardShortcutHint', () => {
  beforeEach(() => {
    // Reset navigator mock
    Object.defineProperty(window.navigator, 'platform', {
      writable: true,
      configurable: true,
      value: 'MacIntel',
    });
  });

  describe('Render and display', () => {
    it('renders keyboard shortcut with keys', () => {
      render(<KeyboardShortcutHint keys={['Cmd', 'K']} action="Command palette" />);

      expect(screen.getByText('Command palette')).toBeInTheDocument();
      // On Mac, should show ⌘
      expect(screen.getByText('⌘')).toBeInTheDocument();
      expect(screen.getByText('K')).toBeInTheDocument();
    });

    it('shows action text only on sm+ screens', () => {
      render(<KeyboardShortcutHint keys={['Cmd', 'K']} action="Command palette" />);

      const actionText = screen.getByText('Command palette');
      expect(actionText).toHaveClass('hidden');
      expect(actionText).toHaveClass('sm:inline');
    });

    it('displays multiple keys with separator', () => {
      render(<KeyboardShortcutHint keys={['Cmd', 'Shift', 'D']} action="Toggle theme" />);

      expect(screen.getByText('⌘')).toBeInTheDocument();
      expect(screen.getByText('⇧')).toBeInTheDocument();
      expect(screen.getByText('D')).toBeInTheDocument();

      // Should have + separators between keys
      const separators = screen.getAllByText('+');
      expect(separators).toHaveLength(2);
    });
  });

  describe('OS detection', () => {
    it('shows ⌘ on Mac', () => {
      Object.defineProperty(window.navigator, 'platform', {
        value: 'MacIntel',
        configurable: true,
      });

      render(<KeyboardShortcutHint keys={['Cmd']} action="Test" />);

      expect(screen.getByText('⌘')).toBeInTheDocument();
    });

    it('shows Ctrl on Windows', () => {
      Object.defineProperty(window.navigator, 'platform', {
        value: 'Win32',
        configurable: true,
      });

      render(<KeyboardShortcutHint keys={['Cmd']} action="Test" />);

      expect(screen.getByText('Ctrl')).toBeInTheDocument();
    });

    it('shows Ctrl on Linux', () => {
      Object.defineProperty(window.navigator, 'platform', {
        value: 'Linux x86_64',
        configurable: true,
      });

      render(<KeyboardShortcutHint keys={['Cmd']} action="Test" />);

      expect(screen.getByText('Ctrl')).toBeInTheDocument();
    });
  });

  describe('Special key symbols', () => {
    it('shows ⇧ for Shift', () => {
      render(<KeyboardShortcutHint keys={['Shift', 'K']} action="Test" />);

      expect(screen.getByText('⇧')).toBeInTheDocument();
    });

    it('shows ↵ for Enter', () => {
      render(<KeyboardShortcutHint keys={['Enter']} action="Submit" />);

      expect(screen.getByText('↵')).toBeInTheDocument();
    });

    it('shows Esc for Escape', () => {
      render(<KeyboardShortcutHint keys={['Escape']} action="Close" />);

      expect(screen.getByText('Esc')).toBeInTheDocument();
    });

    it('shows ⌥ for Alt on Mac', () => {
      Object.defineProperty(window.navigator, 'platform', {
        value: 'MacIntel',
        configurable: true,
      });

      render(<KeyboardShortcutHint keys={['Alt', 'K']} action="Test" />);

      expect(screen.getByText('⌥')).toBeInTheDocument();
    });

    it('shows Alt for Alt on Windows', () => {
      Object.defineProperty(window.navigator, 'platform', {
        value: 'Win32',
        configurable: true,
      });

      render(<KeyboardShortcutHint keys={['Alt', 'K']} action="Test" />);

      expect(screen.getByText('Alt')).toBeInTheDocument();
    });
  });

  describe('Custom className', () => {
    it('applies custom className', () => {
      const { container } = render(
        <KeyboardShortcutHint
          keys={['Cmd', 'K']}
          action="Test"
          className="custom-class"
        />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});

describe('ShortcutList', () => {
  const mockShortcuts = [
    { keys: ['Cmd', 'K'], action: 'Open command palette' },
    { keys: ['Cmd', 'N'], action: 'New task' },
    { keys: ['Escape'], action: 'Close modal' },
  ];

  it('renders list of shortcuts', () => {
    render(<ShortcutList shortcuts={mockShortcuts} />);

    expect(screen.getByText('Open command palette')).toBeInTheDocument();
    expect(screen.getByText('New task')).toBeInTheDocument();
    expect(screen.getByText('Close modal')).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(<ShortcutList shortcuts={mockShortcuts} title="Keyboard Shortcuts" />);

    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
  });

  it('renders without title when not provided', () => {
    const { container } = render(<ShortcutList shortcuts={mockShortcuts} />);

    const title = container.querySelector('h3');
    expect(title).not.toBeInTheDocument();
  });

  it('renders all shortcut keys', () => {
    render(<ShortcutList shortcuts={mockShortcuts} />);

    // Should have K and N keys visible
    expect(screen.getByText('K')).toBeInTheDocument();
    expect(screen.getByText('N')).toBeInTheDocument();
    expect(screen.getByText('Esc')).toBeInTheDocument();
  });
});

describe('KEYBOARD_SHORTCUTS constant', () => {
  it('exports global shortcuts', () => {
    expect(KEYBOARD_SHORTCUTS.global).toBeDefined();
    expect(KEYBOARD_SHORTCUTS.global.length).toBeGreaterThan(0);
  });

  it('exports navigation shortcuts', () => {
    expect(KEYBOARD_SHORTCUTS.navigation).toBeDefined();
    expect(KEYBOARD_SHORTCUTS.navigation.length).toBeGreaterThan(0);
  });

  it('exports task shortcuts', () => {
    expect(KEYBOARD_SHORTCUTS.tasks).toBeDefined();
    expect(KEYBOARD_SHORTCUTS.tasks.length).toBeGreaterThan(0);
  });

  it('includes command palette shortcut in global', () => {
    const cmdKShortcut = KEYBOARD_SHORTCUTS.global.find(
      (s) => s.keys[0] === 'Cmd' && s.keys[1] === 'K'
    );
    expect(cmdKShortcut).toBeDefined();
    expect(cmdKShortcut?.action).toContain('command palette');
  });

  it('includes new task shortcut in tasks', () => {
    const newTaskShortcut = KEYBOARD_SHORTCUTS.tasks.find(
      (s) => s.keys[0] === 'Cmd' && s.keys[1] === 'N'
    );
    expect(newTaskShortcut).toBeDefined();
    expect(newTaskShortcut?.action).toContain('New task');
  });
});
