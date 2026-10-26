import { useState } from "react";
import { Mail, MapPin, Send } from "lucide-react";
import { api, getApiErrorMessage } from "../api";

function Contact() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSending(true);
    const form = new FormData(event.currentTarget);
    try {
      await api.post("/api/contact", {
        name: form.get("name"),
        email: form.get("email"),
        subject: form.get("subject"),
        message: form.get("message"),
      });
      setSent(true);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Message could not be sent. Please try again later."));
    } finally {
      setSending(false);
    }
  };
  return (
    <div className="page">

      <section className="page-hero">
        <p>Home / Contact</p>
        <h1>Contact Us</h1>
        <span>
          Have a question or need help with a lost or found item?
          <br />
          We're here to help.
        </span>
      </section>

      <section className="contact-container">

        <div className="contact-info">

          <h2>Get in Touch</h2>
          <p>
            If you have questions about LostLink or need assistance,
            contact our campus support team.
          </p>

          <div className="contact-item">
            <Mail />
            <div>
              <h3>Email</h3>
              <p>Use the message form to contact support.</p>
            </div>
          </div>

          <div className="contact-item">
            <MapPin />
            <div>
              <h3>Location</h3>
              <p>Campus Help Desk, Main Block</p>
            </div>
          </div>

        </div>

        <form className="contact-form" onSubmit={handleSubmit}>
          <h2>Send us a Message</h2>
          <div className="info-box">
            Online messaging is coming soon. For now, please visit the Campus Help Desk, Main Block.
          </div>

          {sent ? (
            <div className="auth-message success">
              Online messaging is not available in this version.
            </div>
          ) : (
            <>
              {error && <div className="auth-message error" role="alert">{error}</div>}
              <label htmlFor="contact-name">Your Name *</label>
              <input id="contact-name" name="name" placeholder="Full name" minLength={2} maxLength={100} required />

              <label htmlFor="contact-email">Email *</label>
              <input id="contact-email" name="email" type="email" maxLength={254} placeholder="you@example.com" required />

              <label htmlFor="contact-subject">Subject *</label>
              <input id="contact-subject" name="subject" placeholder="How can we help?" minLength={2} maxLength={160} required />

              <label htmlFor="contact-message">Message *</label>
              <textarea id="contact-message" name="message" placeholder="Write your message here..." minLength={5} maxLength={4000} required />

              <button type="submit" disabled title={sending ? "Sending..." : "Online messaging is not available in this version."}>
                <Send size={15} />
                Coming soon
              </button>
            </>
          )}
        </form>

      </section>

    </div>
  );
}

export default Contact;