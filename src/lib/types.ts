export type FormFieldType = "text" | "textarea" | "email" | "select" | "date" | "file";

export type FormSchemaField = {
  key: string;
  label: string;
  type: FormFieldType;
  required?: boolean;
  options?: string[];
};

export type InputRequestKind = "form" | "freetext";

export type InputRequestStatus = "draft" | "open" | "submitted" | "accepted" | "reopened";

export type ReportStatus = "draft" | "published";

export type PortalClient = {
  id: string;
  name: string;
  slug: string;
  logo_path: string | null;
  primary_contact_email: string | null;
};
