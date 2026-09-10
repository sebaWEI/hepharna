declare module '3dmol' {
  export function createViewer(
    element: HTMLElement,
    config?: Record<string, unknown>,
  ): {
    addModel: (data: string, format: string) => unknown
    setStyle: (sel: object, style: object) => void
    zoomTo: () => void
    render: () => void
    clear: () => void
  }
}
