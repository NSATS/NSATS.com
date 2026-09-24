/*
  NSATS website - backend addresses.
  Fill in the public addresses supplied by the backend developer.
  While a value is empty, the matching form reports that it is temporarily unavailable.
*/
(function () {
  window.NSATS_API = {
    challenge: "",     // GET  anti-spam challenge (?kind=sum or ?kind=max)
    contact: "",       // POST support request (contact.html)
    onboarding: "",    // POST consultation / onboarding request (onboarding.html)
    supportCentre: ""  // page shown inside osticket.html
  };

  function url(key, params) {
    var base = window.NSATS_API[key];
    if (!base) return null;
    var u = new URL(base, window.location.href);
    if (params) Object.keys(params).forEach(function (k) { u.searchParams.set(k, params[k]); });
    return u.toString();
  }

  async function getJSON(key, params) {
    var u = url(key, params);
    if (!u) throw new Error("unavailable");
    var res = await fetch(u, { method: "GET", credentials: "omit", cache: "no-store" });
    var json = {};
    try { json = await res.json(); } catch (e) {}
    if (!res.ok || !json.ok) throw new Error(json.error || "request_failed");
    return json;
  }

  async function postJSON(key, body) {
    var u = url(key);
    if (!u) return { ok: false, error: "This form is temporarily unavailable. Please try again later." };
    try {
      var res = await fetch(u, {
        method: "POST", credentials: "omit", cache: "no-store",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
      });
      var json = {};
      try { json = await res.json(); } catch (e) {}
      if (res.ok && json.ok) return { ok: true };
      return { ok: false, error: json.error || "Unable to send your request right now. Please try again later." };
    } catch (e) {
      return { ok: false, error: "Unable to send your request right now. Please try again later." };
    }
  }

  window.NSATS = { url: url, getJSON: getJSON, postJSON: postJSON };
})();
