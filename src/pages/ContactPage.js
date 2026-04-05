import React, { useState } from 'react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="info-page">
      <div className="info-hero">
        <h1>Contact &amp; Feedback</h1>
        <p>Questions, suggestions, or data issues — I'd love to hear from you</p>
      </div>

      <div className="info-content">
        <section className="info-section contact-section">
          {submitted ? (
            <div className="submitted-msg">
              <div className="submitted-icon">✓</div>
              <h2>Thanks for your feedback!</h2>
              <p>Your message has been noted. I'll get back to you shortly.</p>
            </div>
          ) : (
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input type="text" placeholder="Your name" required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" placeholder="your@email.com" required />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select>
                  <option>General feedback</option>
                  <option>Bug report</option>
                  <option>Data suggestion</option>
                  <option>Feature request</option>
                </select>
              </div>
              <div className="form-group">
                <label>Message</label>
                <textarea rows={5} placeholder="Your message..." required />
              </div>
              <button type="submit" className="btn-primary">Send Message →</button>
            </form>
          )}

          <div className="contact-alt">
            <p>Or email directly: <a href="mailto:chinmaymhatre@arizona.edu">chinmaymhatre@arizona.edu</a></p>
          </div>
        </section>
      </div>
    </div>
  );
}
