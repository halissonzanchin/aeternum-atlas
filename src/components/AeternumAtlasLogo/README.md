# AeternumAtlasLogo

Componente React/TypeScript com SVG/CSS da marca Aeternum Atlas, sem imagem rasterizada.

```jsx
import AeternumAtlasLogo from "./components/AeternumAtlasLogo";

export function Example() {
  return (
    <>
      <AeternumAtlasLogo variant="full" size="xl" theme="dark" />
      <AeternumAtlasLogo variant="horizontal" size="sm" theme="transparent" />
      <AeternumAtlasLogo variant="symbol" size="md" theme="light" />
    </>
  );
}
```

Props:

- `variant`: `"full" | "symbol" | "horizontal"`
- `theme`: `"dark" | "light" | "transparent"`
- `size`: `"sm" | "md" | "lg" | "xl"`
