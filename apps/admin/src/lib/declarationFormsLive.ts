import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@schoolerp/shared';
import type { DeclarationForm } from './types';

type DeclarationFormsClient = SupabaseClient<Database>;

export interface MappedDeclarationFormsData {
  declarations: DeclarationForm[];
}

export async function loadDeclarationFormsData(client: DeclarationFormsClient): Promise<MappedDeclarationFormsData> {
  const { data, error } = await (client.from('declaration_forms') as any).select('*').order('created_at', { ascending: false });
  if (error) throw new Error('Could not load declaration forms. Please try again.');
  return { declarations: (data ?? []) as DeclarationForm[] };
}

export interface CreateDeclarationFormInput {
  name: string;
  description: string;
  type: string;
}

export async function createDeclarationForm(client: DeclarationFormsClient, input: CreateDeclarationFormInput): Promise<void> {
  const { error } = await (client.from('declaration_forms') as any).insert({
    name: input.name,
    description: input.description,
    type: input.type,
    status: 'pending',
    signed_by: [],
    created_at: new Date().toISOString(),
  });
  if (error) throw new Error('Could not create declaration form. Please try again.');
}

export interface SignDeclarationInput {
  id: string;
  student_id: string;
}

export async function signDeclaration(client: DeclarationFormsClient, input: SignDeclarationInput): Promise<void> {
  const { error } = await (client.from('declaration_forms') as any).update({
    signed_by: [input.student_id],
    status: 'signed',
    signed_at: new Date().toISOString(),
  }).eq('id', input.id);
  if (error) throw new Error('Could not sign declaration. Please try again.');
}
