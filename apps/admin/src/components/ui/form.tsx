
import React from 'react';
import { Controller, type ControllerProps, type FieldPath, type FieldValues } from 'react-hook-form';

export const Form = ({ children, className, ...props }: any) => {
  // Filter out React Hook Form props that shouldn't be passed to DOM
  const {
    getValues, resetField, clearErrors, setError, setFocus,
    getFieldState, formState, subscribe, trigger, register,
    watch, reset, unregister, ...domProps
  } = props;

  return (
    <div className={className} {...domProps}>{children}</div>
  );
};

export const FormControl = ({ children }: any) => (
  <div>{children}</div>
);

type FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = ControllerProps<TFieldValues, TName>;

export function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({ ...props }: FormFieldProps<TFieldValues, TName>) {
  return <Controller {...props} />;
}

export const FormItem = ({ children, className }: any) => (
  <div className={`space-y-2 ${className || ''}`}>{children}</div>
);

export const FormLabel = ({ children, className }: any) => (
  <label className={`text-sm font-medium ${className || ''}`}>{children}</label>
);

export const FormDescription = ({ children, className }: any) => (
  <p className={`text-sm text-muted-foreground ${className || ''}`}>{children}</p>
);

export const FormMessage = ({ children, className }: any) => {
  if (!children) return null;
  return (
    <p className={`text-sm text-red-500 ${className || ''}`}>{children}</p>
  );
};