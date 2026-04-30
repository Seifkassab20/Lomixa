-- Helper function to increment pharma balance safely
create or replace function public.increment_pharma_balance(p_id uuid, amount integer)
returns void as $$
begin
  update public.pharma_companies
  set balance = balance + amount
  where id = p_id;
end;
$$ language plpgsql security definer;
