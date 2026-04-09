'use client';

import { useState } from 'react';

interface FormState {
  status: 'idle' | 'submitting' | 'success' | 'error';
  message: string;
}

const initialState: FormState = {
  status: 'idle',
  message: '',
};

export default function ContactForm() {
  const [state, setState] = useState<FormState>(initialState);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    setState({ status: 'submitting', message: 'Sending your message...' });

    const payload = {
      name: formData.get('name'),
      email: formData.get('email'),
      message: formData.get('message'),
      website: formData.get('website'),
    };

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const body = (await response.json().catch(() => null)) as
        | { data?: { message?: string }; error?: string }
        | null;

      if (!response.ok) {
        setState({
          status: 'error',
          message: body?.error ?? 'Unable to send your message right now.',
        });
        return;
      }

      form.reset();
      setState({
        status: 'success',
        message: body?.data?.message ?? 'Your message has been received.',
      });
    } catch {
      setState({
        status: 'error',
        message: 'A network error prevented the message from being sent.',
      });
    }
  }

  const isPending = state.status === 'submitting';

  return (
    <form className="site-panel space-y-4 p-4 sm:p-6" method="POST" onSubmit={handleSubmit}>
      <div>
        <label className="field-label" htmlFor="name">
          Name
        </label>
        <input id="name" name="name" type="text" required className="field-input" />
      </div>

      <div>
        <label className="field-label" htmlFor="email">
          Email
        </label>
        <input id="email" name="email" type="email" required className="field-input" />
      </div>

      {/* honeypot — hidden from real users */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <label className="field-label" htmlFor="message">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          className="field-input min-h-32 resize-y"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-brand-muted text-xs">
          Submissions are stored securely for ministry follow-up.
        </p>
        <button
          type="submit"
          className="button-primary sm:shrink-0 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isPending}
        >
          {isPending ? 'Sending…' : 'Send Message'}
        </button>
      </div>

      {state.message ? (
        <p
          className={`text-sm ${state.status === 'error' ? 'text-red-700' : 'text-brand-primary'}`}
          role="status"
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}