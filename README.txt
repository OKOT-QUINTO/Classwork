CLASSWORK ANALYSIS - SUPABASE VERSION
=====================================
STEP 1  Create the database (free)
  - Go to supabase.com, sign up, click New project. Choose a name, a database password and the region nearest you.
STEP 2  Allow simple accounts
  - Authentication > Providers > Email > turn OFF "Confirm email" > Save.
STEP 3  Create the tables
  - SQL Editor > New query > paste everything from supabase-setup.sql > Run.
STEP 4  Copy your keys
  - Project Settings > API. Copy the Project URL and the "anon public" key. (Never use the service_role key.)
STEP 5  Put the keys in the app
  - Open index.html in Notepad. At the top find  const SB_URL='',SB_KEY='';  and paste the URL and key between the quotes. Save.
STEP 6  Put the app online (free)
  - Go to app.netlify.com/drop and drag this whole folder onto the page. You get a web address. Open it on phones and computers.
  - On a phone: browser menu > Add to Home screen. The app opens full screen with the Classwork Analysis icon.
STEP 7  First sign-in
  - The FIRST person chooses "Create account". That person is the administrator and sets the ACCESS CODE.
  - Teachers choose "Create account" and enter a username, password and the access code. Later they just Sign in.

NOTES
  - All devices see the same data. The page shows Saved / Saving / NOT SAVED at the top. If it says NOT SAVED, check the internet.
  - Free Supabase projects pause after about a week with no use; open the Supabase dashboard and click Restore if that happens.
  - Download a backup file from Setup regularly (Setup > Backup & restore).
  - PDFs get unique names with school, report, class, date and time. Dates show as ddd-dd-mm-yyyy.
  - The phone zoom problem is fixed: pages no longer zoom when you tap.
