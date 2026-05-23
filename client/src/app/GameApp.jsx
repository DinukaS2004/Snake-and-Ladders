'use client';
import dynamic from 'next/dynamic';

// socket.io-client uses browser globals (window, WebSocket) that crash during
// SSR. ssr:false must live in a Client Component, so this wrapper owns it.
const App = dynamic(() => import('../App'), { ssr: false });

export default function GameApp() {
  return <App />;
}
