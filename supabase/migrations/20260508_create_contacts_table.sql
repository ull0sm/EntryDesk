-- Create contacts table for contact form submissions
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anonymous inserts (for contact form)
CREATE POLICY "Allow anonymous inserts to contacts" ON contacts
  FOR INSERT
  WITH CHECK (true);

-- Create policy to allow authenticated users to read all contacts
CREATE POLICY "Allow authenticated users to read contacts" ON contacts
  FOR SELECT
  USING (auth.role() = 'authenticated');
