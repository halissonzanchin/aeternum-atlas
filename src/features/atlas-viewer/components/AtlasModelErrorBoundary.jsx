import React from 'react';
import { Html } from '@react-three/drei';

export class AtlasModelErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[AtlasViewer] Falha crítica ao carregar o modelo 3D:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Html center>
          <div className="atlas-viewer-error-card atlas-viewer-state">
            <svg className="w-12 h-12 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-white atlas-viewer-state-title mb-2">Erro de Renderização</p>
            <p className="text-white/80 atlas-viewer-state-description">
              Não foi possível carregar o modelo 3D otimizado. Verifique se o arquivo GLB foi exportado corretamente e se os decoders Draco/Meshopt estão disponíveis.
            </p>
          </div>
        </Html>
      );
    }

    return this.props.children;
  }
}
