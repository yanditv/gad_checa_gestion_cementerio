import React from 'react';

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: string;
}

export function TextInput({ icon, className = '', ...props }: TextInputProps) {
  if (icon) {
    return (
      <div className="search-box">
        <i className={`ti ${icon}`}></i>
        <input className={`form-control ${className}`.trim()} {...props} />
      </div>
    );
  }

  return <input className={`form-control ${className}`.trim()} {...props} />;
}

