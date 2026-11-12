import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPost, mockGet } = vi.hoisted(() => ({
  mockPost: vi.fn(),
  mockGet: vi.fn(),
}));

vi.mock('./api', () => ({
  default: {
    post: mockPost,
    get: mockGet,
  },
}));

import { getDeliveryChallanPdf } from './delivery_challan';

describe('getDeliveryChallanPdf', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('unwraps res.data on POST with rendered html/template payload', async () => {
    const pdfBlob = new Blob(['%PDF-1.4\n%%EOF'], { type: 'application/pdf' });
    mockPost.mockResolvedValue({ data: pdfBlob, status: 200 });

    const payload = { html: '<html></html>', template: { id: 'billship' } };
    const result = await getDeliveryChallanPdf('dc-123', payload);

    expect(mockPost).toHaveBeenCalledWith(
      '/billing/delivery-challans/dc-123/pdf/',
      payload,
      { responseType: 'blob' }
    );
    expect(result).toBe(pdfBlob);
  });

  it('unwraps res.data on GET fallback without payload', async () => {
    const pdfBlob = new Blob(['%PDF-1.4\n%%EOF'], { type: 'application/pdf' });
    mockGet.mockResolvedValue({ data: pdfBlob, status: 200 });

    const result = await getDeliveryChallanPdf('dc-456');

    expect(mockGet).toHaveBeenCalledWith(
      '/billing/delivery-challans/dc-456/pdf/',
      { responseType: 'blob' }
    );
    expect(result).toBe(pdfBlob);
  });
});
