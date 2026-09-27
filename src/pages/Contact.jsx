import { useState } from "react";
import { Mail, Phone, MapPin, Send } from "lucide-react";

function Contact() {
  const [sent, setSent] = useState(false);
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
              <p>support@lostlink.com</p>
            </div>
          </div>

          <div className="contact-item">
            <Phone />
            <div>
              <h3>Phone</h3>
              <p>+91 98765 43210</p>
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

        <form className="contact-form" onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
          <h2>Send us a Message</h2>

          {sent ? (
            <div className="auth-message success">
              Thank you for reaching out! Our campus help desk team will get back to you shortly.
            </div>
          ) : (
            <>
              <label>Your Name *</label>
              <input placeholder="Full name" required />

              <label>Email *</label>
              <input type="email" placeholder="you@example.com" required />

              <label>Subject *</label>
              <input placeholder="How can we help?" required />

              <label>Message *</label>
              <textarea placeholder="Write your message here..." required />

              <button type="submit">
                <Send size={15} />
                Send Message
              </button>
            </>
          )}
        </form>

      </section>

    </div>
  );
}

export default Contact;