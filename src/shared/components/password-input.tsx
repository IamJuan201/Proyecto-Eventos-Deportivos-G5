'use client';

import { useState, type InputHTMLAttributes } from 'react';
import { useTranslate } from '@/shared/i18n/locale-provider';

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  /** Classes for the wrapper, e.g. spacing that used to live on the input. */
  wrapperClassName?: string;
};

/** Password field with a show/hide toggle. Accepts the same props as an <input>. */
export function PasswordInput({ wrapperClassName, ...props }: PasswordInputProps) {
  const t = useTranslate();
  const [visible, setVisible] = useState(false);
  const label = t('Mostrar contraseña');
  return (
    <span className={'password-field' + (wrapperClassName ? ' ' + wrapperClassName : '')}>
      <input {...props} type={visible ? 'text' : 'password'} />
      <button type="button" className="password-toggle" onClick={() => setVisible((current) => !current)} aria-label={label} aria-pressed={visible} title={label}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
          {visible && <path d="M4 4l16 16" />}
        </svg>
      </button>
    </span>
  );
}
