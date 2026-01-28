declare module '*.mdx' {
  import type { ComponentProps, ComponentType, ReactElement } from 'react';

  export interface MDXProps {
    components?: Record<string, ComponentType<any>>;
  }

  const MDXComponent: ComponentType<MDXProps>;
  export default MDXComponent;
}
