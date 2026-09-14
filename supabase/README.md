# Supabase database migrations

`20260914000000_identity_accounts.sql` adds application-owned identities. `auth.users` remains the authentication source; it does not create or relate CRM `People` or `Organisations` records.

Every new Auth account gets an `identity_profiles` record and the `member` role. `app_admin` is never assigned automatically. Bootstrap one administrator only after that person has signed in:

```sql
insert into public.identity_role_assignments (user_id, role_key)
values ('AUTH_USER_UUID', 'app_admin');
```

The app calls security-definer RPCs through the signed-in user's session. They enforce `app_admin` in the database, and are the only way the UI can list account email addresses or change roles. Do not expose a service-role key to the browser.

Apply the migration using your normal deployment workflow or Supabase CLI. It has not been applied by this repository.
