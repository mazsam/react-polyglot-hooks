import { cloneElement, isValidElement, ReactElement, ReactNode } from 'react';
import { PolyglotT } from './constants';

/**
 * A pseudo-JSX string interpolation identifier.
 */
const IDENTIFIER = /<(\d+)\/>/;

/**
 * An function to enhance Polyglot.js to allow React component interpolations.
 *
 * @param originalT The original t function from Polyglot.js.
 * @returns The enhanced t function.
 */
const enhanceT = (originalT: PolyglotT) => {
  /**
   * The t function for translation.
   *
   * @param key The key of a translate phrase.
   * @param interpolations The nodes to be interpolated to the phrase.
   * @returns A string, or an array of components and strings.
   */
  // An overload is included to aid code auto-completion
  function t(
    key: Parameters<PolyglotT>[0],
    interpolations?: Parameters<PolyglotT>[1]
  ): ReactElement;
  // We use a named function here to aid debugging
  // ReactNode includes all React render-ables, including arrays
  function t(...[key, interpolations]: Parameters<PolyglotT>): ReactElement {
    if (interpolations === undefined || typeof interpolations === 'number') {
      return (originalT(key, interpolations) as ReactNode) as ReactElement;
    } else {
      // ReactElement used because cloneElement requires a proper ReactElement
      const elementCache: ReactElement[] = [];
      Object.keys(interpolations).forEach(key => {
        // Store all JSX elements into a array cache for processing later
        if (isValidElement(interpolations[key])) {
          elementCache.push(interpolations[key]);
          interpolations[key] = `<${elementCache.length - 1}/>`;
        }
      });

      const tString = originalT(key, interpolations);
      // We can safely return if no element interpolation is needed
      if (!elementCache.length) {
        return (tString as ReactNode) as ReactElement;
      }

      // Split the string into chunks of strings and interpolation indices
      const tChunks = tString.split(IDENTIFIER);
      // Move the leading string part into the render array and pop it
      const renderItems: Array<ReactNode> = tChunks.splice(0, 1);
      for (let i = 0; i < Math.ceil(tChunks.length); i += 1) {
        const [index, trailingString] = tChunks.splice(0, 2);
        const currentIndex = parseInt(index, 10);
        const currentElement = elementCache[currentIndex];

        // Interpolate the element
        renderItems.push(
          cloneElement(
            currentElement,
            // A unique key is needed when rendering an array
            { key: currentIndex },
            currentElement.props.children
          )
        );

        // Interpolate any trailing string
        if (trailingString) {
          renderItems.push(trailingString);
        }
      }

      return (renderItems as ReactNode) as ReactElement;
    }
  }

  return t;
};

export default enhanceT;
