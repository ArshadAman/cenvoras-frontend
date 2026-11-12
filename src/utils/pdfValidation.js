/**
 * Validates that a downloaded PDF API response is actual PDF binary bytes (`%PDF-`)
 * rather than an unwrapped AxiosResponse (`[object Object]`), HTML error page, or JSON payload.
 */
export async function resolveValidPdfBlob(rawResult) {
  const isRealBlob =
    (typeof Blob !== 'undefined' && rawResult instanceof Blob) ||
    Object.prototype.toString.call(rawResult) === '[object Blob]';

  if (isRealBlob) {
    if (rawResult.size < 5) {
      throw new Error(`Invalid PDF response: payload too small (${rawResult.size} bytes).`);
    }

    const headSlice = rawResult.slice(0, 5);
    let header = '';
    if (typeof headSlice.arrayBuffer === 'function') {
      const bytes = new Uint8Array(await headSlice.arrayBuffer());
      header = String.fromCharCode(...bytes);
    } else if (typeof headSlice.text === 'function') {
      header = await headSlice.text();
    } else if (typeof Response !== 'undefined') {
      const bytes = new Uint8Array(await new Response(headSlice).arrayBuffer());
      header = String.fromCharCode(...bytes);
    } else {
      throw new Error('Unable to inspect PDF response header.');
    }

    if (!header.startsWith('%PDF-')) {
      throw new Error(`Invalid PDF response: expected %PDF- header, got "${header}".`);
    }

    if (rawResult.type === 'application/pdf') {
      return rawResult;
    }
    return typeof Blob !== 'undefined' && rawResult instanceof Blob
      ? new Blob([rawResult], { type: 'application/pdf' })
      : rawResult;
  }

  if (rawResult instanceof ArrayBuffer || ArrayBuffer.isView(rawResult)) {
    const bytes =
      rawResult instanceof ArrayBuffer
        ? new Uint8Array(rawResult)
        : new Uint8Array(rawResult.buffer, rawResult.byteOffset, rawResult.byteLength);

    if (bytes.byteLength < 5) {
      throw new Error(`Invalid PDF response: payload too small (${bytes.byteLength} bytes).`);
    }

    const header = String.fromCharCode(...bytes.subarray(0, 5));
    if (header !== '%PDF-') {
      throw new Error(`Invalid PDF response: expected %PDF- header, got "${header}".`);
    }

    return new Blob([bytes], { type: 'application/pdf' });
  }

  throw new Error('Invalid PDF response: expected binary Blob or ArrayBuffer.');
}
