// console.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ITerminalOptions, Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { SearchAddon } from 'xterm-addon-search';
import { SearchBarAddon } from 'xterm-addon-search-bar';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { ScrollDownHelperAddon } from '@/plugins/XtermScrollDownHelperAddon';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import { ServerContext } from '@/state/server';
import { usePermissions } from '@/plugins/usePermissions';
import { theme as th } from 'twin.macro';
import useEventListener from '@/plugins/useEventListener';
import { debounce } from 'debounce';
import { usePersistedState } from '@/plugins/usePersistedState';
import { SocketEvent, SocketRequest } from '@/components/server/events';
import classNames from 'classnames';
import { ChevronDoubleRightIcon } from '@heroicons/react/solid';

import 'xterm/css/xterm.css';
import styles from './style.module.css';

// Constants
const terminalPrelude = '\u001b[1m\u001b[33mcontainer@pterodactyl~ \u001b[0m';

// Terminal Props
const terminalProps: ITerminalOptions = {
  disableStdin: true,
  cursorStyle: 'underline',
  allowTransparency: true,
  fontSize: 12,
  fontFamily: th('fontFamily.mono'),
  rows: 30,
  theme: {
    background: 'rgba(128, 0, 128, 0.5)', // Transparent purple background
    cursor: 'transparent',
    black: th`colors.black`.toString(),
    red: '#E54B4B',
    green: '#9ECE58',
    yellow: '#FAED70',
    blue: '#396FE2',
    magenta: '#BB80B3',
    cyan: '#2DDAFD',
    white: '#d0d0d0',
    brightBlack: 'rgba(255, 255, 255, 0.2)',
    brightRed: '#FF5370',
    brightGreen: '#C3E88D',
    brightYellow: '#FFCB6B',
    brightBlue: '#82AAFF',
    brightMagenta: '#C792EA',
    brightCyan: '#89DDFF',
    brightWhite: '#ffffff',
    selection: '#FAF089',
  },
};

// Console Component
export default () => {
  const ref = useRef<HTMLDivElement>(null);
  const terminal = useMemo(() => new Terminal({ ...terminalProps }), []);
  const fitAddon = new FitAddon();
  const searchAddon = new SearchAddon();
  const searchBar = new SearchBarAddon({ searchAddon });
  const webLinksAddon = new WebLinksAddon();
  const scrollDownHelperAddon = new ScrollDownHelperAddon();
  const { connected, instance } = ServerContext.useStoreState((state) => state.socket);
  const [canSendCommands] = usePermissions(['control.console']);
  const serverId = ServerContext.useStoreState((state) => state.server.data!.id);
  const isTransferring = ServerContext.useStoreState((state) => state.server.data!.isTransferring);
  const [history, setHistory] = usePersistedState<string[]>(`${serverId}:command_history`, []);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Handle Console Output
  const handleConsoleOutput = (line: string, prelude = false) =>
    terminal.writeln((prelude ? terminalPrelude : '') + line.replace(/(?:\r\n|\r|\n)$/im, '') + '\u001b[0m');

  // Handle Transfer Status
  const handleTransferStatus = (status: string) => {
    switch (status) {
      case 'failure':
        terminal.writeln(terminalPrelude + 'Transfer has failed.\u001b[0m');
        return;
      case 'archive':
        terminal.writeln(
          terminalPrelude + 'Server has been archived successfully, attempting connection to target node..\u001b[0m'
        );
    }
  };

  // Handle Daemon Error Output
  const handleDaemonErrorOutput = (line: string) =>
    terminal.writeln(terminalPrelude + '\u001b[1m\u001b[41m' + line.replace(/(?:\r\n|\r|\n)$/im, '') + '\u001b[0m');

  // Handle Power Change Event
  const handlePowerChangeEvent = (state: string) =>
    terminal.writeln(terminalPrelude + 'Server marked as ' + state + '.\u001b[0m');

  // Handle Server Status Update
  const handleServerStatusUpdate = (status: string) =>
    terminal.writeln(terminalPrelude + 'Server status updated to ' + status + '.\u001b[0m');

  // Handle Server Event
  const handleServerEvent = (event: SocketEvent) => {
    switch (event.type) {
      case 'console_output':
        handleConsoleOutput(event.data);
        break;
      case 'transfer_status':
        handleTransferStatus(event.data);
        break;
      case 'daemon_error_output':
        handleDaemonErrorOutput(event.data);
        break;
      case 'power_change':
        handlePowerChangeEvent(event.data);
        break;
      case 'server_status_update':
        handleServerStatusUpdate(event.data);
    }
  };

  // Initialize Terminal
  useEffect(() => {
    if (ref.current) {
      terminal.open(ref.current);
      terminal.loadAddon(fitAddon);
      terminal.loadAddon(searchAddon);
      terminal.loadAddon(searchBar);
      terminal.loadAddon(webLinksAddon);
      terminal.loadAddon(scrollDownHelperAddon);
      terminal.focus();
    }
  }, [ref]);

  // Handle Socket Events
  useEffect(() => {
    if (instance) {
      instance.on('event', handleServerEvent);
    }
    return () => {
      if (instance) {
        instance.off('event', handleServerEvent);
      }
    };
  }, [instance]);

  // Handle Command Input
  const handleCommandInput = (command: string) => {
    if (canSendCommands) {
      instance?.emit('command', command);
      setHistory((prevHistory) => [...prevHistory, command]);
      setHistoryIndex(-1);
    }
  };

  // Handle Command History Navigation
  const handleCommandHistoryNavigation = (direction: 'up' | 'down') => {
    if (direction === 'up' && historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
    } else if (direction === 'down' && historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
    }
  };

  // Render Console
  return (
    <div className={classNames(styles.console, 'flex flex-col h-full w-full overflow-hidden')} ref={ref}>
      {connected && (
        <div className={classNames(styles.consoleHeader, 'flex justify-between items-center p-2')}>
          <ChevronDoubleRightIcon className={classNames(styles.consoleIcon, 'w-4 h-4 text-gray-500')} />
          <span className={classNames(styles.consoleTitle, 'text-sm text-gray-500')}>Console</span>
        </div>
      )}
      {isTransferring && (
        <SpinnerOverlay
          className={classNames(styles.consoleSpinner, 'absolute top-0 left-0 w-full h-full')}
          size={24}
        />
      )}
      <div className={classNames(styles.consoleInput, 'flex items-center p-2')}>
        <input
          type="text"
          className={classNames(styles.consoleInputField, 'w-full p-2 pl-10 text-sm')}
          placeholder="Enter command..."
          value={historyIndex >= 0 ? history[historyIndex] : ''}
          onChange={(e) => {
            if (historyIndex >= 0) {
              setHistoryIndex(-1);
            }
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleCommandInput(e.currentTarget.value);
              e.currentTarget.value = '';
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp') {
              handleCommandHistoryNavigation('up');
            } else if (e.key === 'ArrowDown') {
              handleCommandHistoryNavigation('down');
            }
          }}
        />
      </div>
    </div>
  );
