/**
 * Unified Frappe API Client for Standard Touch HR Ops
 */

function getCsrfToken() {
  if (typeof window !== 'undefined') {
    if (window.ST_BOOT?.csrf_token) return window.ST_BOOT.csrf_token;
    if (window.frappe?.csrf_token) return window.frappe.csrf_token;
    // Check cookies
    const match = document.cookie.match(/csrf_token=([^;]+)/);
    if (match) return match[1];
  }
  return '';
}

/**
 * Uploads a File object via Frappe's standard `/api/method/upload_file`
 * endpoint (multipart form, not JSON — this is why it doesn't go through
 * `callApi`) and returns the resulting `{ file_url, name, ... }` File record.
 */
export async function uploadFile(file, { isPrivate = true, doctype, docname } = {}) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('is_private', isPrivate ? '1' : '0');
  if (doctype) formData.append('doctype', doctype);
  if (docname) formData.append('docname', docname);

  const response = await fetch('/api/method/upload_file', {
    method: 'POST',
    headers: { 'X-Frappe-CSRF-Token': getCsrfToken() },
    body: formData,
  });
  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data._server_messages
      ? parseServerMessages(data._server_messages)
      : data.message || data.exception || `Upload failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data.message;
}

export async function callApi(methodPath, params = {}, httpMethod = 'POST') {
  try {
    const isGet = httpMethod.toUpperCase() === 'GET';
    let url = `/api/method/${methodPath}`;

    const headers = {
      'Accept': 'application/json',
      'X-Frappe-CSRF-Token': getCsrfToken(),
    };

    let fetchOptions = {
      method: httpMethod,
      headers,
    };

    if (isGet) {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          queryParams.append(key, typeof val === 'object' ? JSON.stringify(val) : val);
        }
      });
      const qStr = queryParams.toString();
      if (qStr) url += `?${qStr}`;
    } else {
      headers['Content-Type'] = 'application/json';
      fetchOptions.body = JSON.stringify(params);
    }

    const response = await fetch(url, fetchOptions);
    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data._server_messages 
        ? parseServerMessages(data._server_messages) 
        : data.message || data.exception || `Request failed with status ${response.status}`;
      throw new Error(errorMsg);
    }

    // Frappe returns { message: { status: 'success', data: ... } } or direct payload
    if (data.message && typeof data.message === 'object' && 'status' in data.message) {
      if (data.message.status === 'error') {
        throw new Error(data.message.message || 'Operation failed');
      }
      return data.message;
    }

    return { status: 'success', data: data.message !== undefined ? data.message : data };
  } catch (err) {
    console.error(`API Call failed [${methodPath}]:`, err);
    throw err;
  }
}

function parseServerMessages(messagesStr) {
  try {
    const parsed = JSON.parse(messagesStr);
    return parsed.map(m => {
      try {
        const item = JSON.parse(m);
        return item.message;
      } catch {
        return m;
      }
    }).join('. ');
  } catch {
    return messagesStr;
  }
}

export function formatCurrency(amount, currency = '₹') {
  const num = Number(amount) || 0;
  return `${currency}${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dtStr) {
  if (!dtStr) return '';
  try {
    const d = new Date(dtStr);
    return d.toLocaleString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  } catch {
    return dtStr;
  }
}
