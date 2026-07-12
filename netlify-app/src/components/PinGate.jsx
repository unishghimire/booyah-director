import React from 'react';
// PinGate removed — security handled by Firebase Auth + server-side token verification
export default function PinGate({ children }) {
  return <>{children}</>;
}
