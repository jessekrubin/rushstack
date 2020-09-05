// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

/**
 * Options for {@link AnsiEscape.formatForTests}.
 * @public
 */
export interface IAnsiEscapeConvertForTestsOptions {
  /**
   * If true then `\n` will be replaced by `[n]`, and `\r` will be replaced by `[r]`.
   */
  encodeNewlines?: boolean;
}

/**
 * Operations for working with text strings that contain
 * {@link https://en.wikipedia.org/wiki/ANSI_escape_code | ANSI escape codes}.
 * The most commonly used escape codes set the foreground/background color for console output.
 * @public
 */
export class AnsiEscape {
  // For now, we only care about the Control Sequence Introducer (CSI) commands which always start with "[".
  // eslint-disable-next-line no-control-regex
  private static readonly _csiRegExp: RegExp = /\x1b\[([\x30-\x3f]*[\x20-\x2f]*[\x40-\x7e])/gu;

  // Text coloring is performed using Select Graphic Rendition (SGR) codes, which come after the
  // CSI introducer "ESC [".  The SGR sequence is a number followed by "m".
  private static readonly _sgrRegExp: RegExp = /([0-9]+)m/u;

  private static readonly _backslashNRegExp: RegExp = /\n/g;
  private static readonly _backslashRRegExp: RegExp = /\r/g;

  /**
   * Returns the input text with all ANSI escape codes removed.  For example, this is useful when saving
   * colorized console output to a log file.
   */
  public static removeCodes(text: string): string {
    // eslint-disable-next-line no-control-regex
    return text.replace(AnsiEscape._csiRegExp, '');
  }

  /**
   * Replaces ANSI escape codes with human-readable tokens.  This is useful for unit tests
   * that compare text strings in test assertions or snapshot files.
   */
  public static formatForTests(text: string, options?: IAnsiEscapeConvertForTestsOptions): string {
    if (!options) {
      options = {};
    }

    let result: string = text.replace(AnsiEscape._csiRegExp, (capture: string, csiCode: string) => {
      // If it is an SGR code, then try to show a friendly token
      const match: RegExpMatchArray | null = csiCode.match(AnsiEscape._sgrRegExp);
      if (match) {
        const sgrParameter: number = parseInt(match[1]);
        const sgrParameterName: string | undefined = AnsiEscape._tryGetSgrFriendlyName(sgrParameter);
        if (sgrParameterName) {
          // Example: "[black-bg]"
          return `[${sgrParameterName}]`;
        }
      }

      // Otherwise show the raw code, but without the "[" from the CSI prefix
      // Example: "[31m]"
      return `[${csiCode}]`;
    });

    if (options.encodeNewlines) {
      result = result
        .replace(AnsiEscape._backslashNRegExp, '[n]')
        .replace(AnsiEscape._backslashRRegExp, `[r]`);
    }
    return result;
  }

  // Returns a human-readable token representing an SGR parameter, or undefined for parameter that is not well-known.
  // The SGR parameter numbers are documented in this table:
  // https://en.wikipedia.org/wiki/ANSI_escape_code#SGR_parameters
  private static _tryGetSgrFriendlyName(sgiParameter: number): string | undefined {
    switch (sgiParameter) {
      case 30:
        return 'black';
      case 31:
        return 'red';
      case 32:
        return 'green';
      case 33:
        return 'yellow';
      case 34:
        return 'blue';
      case 35:
        return 'magenta';
      case 36:
        return 'cyan';
      case 37:
        return 'white';
      case 90:
        return 'gray';
      case 39:
        return 'default';
      case 40:
        return 'black-bg';
      case 41:
        return 'red-bg';
      case 42:
        return 'green-bg';
      case 43:
        return 'yellow-bg';
      case 44:
        return 'blue-bg';
      case 45:
        return 'magenta-bg';
      case 46:
        return 'cyan-bg';
      case 47:
        return 'white-bg';
      case 100:
        return 'gray-bg';
      case 49:
        return 'default-bg';
      case 1:
        return 'bold';
      case 21:
        return 'bold-off';
      case 2:
        return 'dim';
      case 22:
        return 'normal';
      case 4:
        return 'underline';
      case 24:
        return 'underline-off';
      case 5:
        return 'blink';
      case 25:
        return 'blink-off';
      case 7:
        return 'invert';
      case 27:
        return 'invert-off';
      case 8:
        return 'hidden';
      case 28:
        return 'hidden-off';
      default:
        return undefined;
    }
  }
}
