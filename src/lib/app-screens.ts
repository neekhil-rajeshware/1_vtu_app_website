import type { Screenshot } from '@/lib/content'

/**
 * The screenshots that ship with the site, captured from the app itself and
 * served straight out of `public/app-screens/`.
 *
 * These are the fallback: the moment a single row exists in `web_screenshots`,
 * Admin -> Screenshots takes over completely and this list is ignored. That way
 * the gallery is never empty on a fresh deploy, but it is still fully editable
 * without touching code.
 *
 * Every capture is a real 1080x2400 screen from a phone, with the student's
 * name, USN, college and email replaced by a demo profile.
 *
 * `hidden: true` means the screen ships switched off — it is still listed in
 * Admin -> Screenshots, where it can be switched on with one click.
 */
type Shot = {
  file: string
  title: string
  caption: string
  category: string
  hidden?: boolean
}

const SHOTS: Shot[] = [
  {
    file: '01-home-top.png',
    title: 'Home',
    caption: 'Profile, daily quote and upcoming exams the moment you open the app.',
    category: 'Home',
  },
  {
    file: '02-home-features.png',
    title: 'Explore Features',
    caption: 'Every tool in the app, one tap from the home screen.',
    category: 'Home',
  },
  {
    file: '28-side-menu.png',
    title: 'Side menu',
    caption: 'AI settings, rewards, reminders, widgets and the theme switch.',
    category: 'Home',
  },
  {
    file: '27-tab-profile.png',
    title: 'My Profile',
    caption: 'USN, branch, college, semester, cycle and backlogs.',
    category: 'Home',
  },
  {
    file: '46-edit-profile.png',
    title: 'Edit profile',
    caption: 'Type your USN once — college and branch fill themselves in.',
    category: 'Home',
  },
  {
    file: '04-ai-study-timetable.png',
    title: 'AI Study Timetable',
    caption: 'A day-by-day revision plan built around your own exam dates.',
    category: 'Study tools',
  },
  {
    file: '45-exam-timetable.png',
    title: 'Exam timetable',
    caption: 'Your VTU exam dates in one list, and the plan is built from them.',
    category: 'Study tools',
    // Ships switched off: this student had no exams scheduled, so the screen is
    // empty. Switch it on in Admin -> Screenshots after a fuller capture.
    hidden: true,
  },
  {
    file: '05-unit-converters.png',
    title: 'Unit Converters',
    caption: 'Engineering units by category, converting as you type.',
    category: 'Study tools',
  },
  {
    file: '06-formulas.png',
    title: 'Formula Library',
    caption: 'Subject-wise formulas you can also calculate with.',
    category: 'Study tools',
  },
  {
    file: '07-top-questions.png',
    title: 'Top Questions',
    caption: 'The questions that keep coming back, module by module.',
    category: 'Study tools',
  },
  {
    file: '08-your-results.png',
    title: 'Your Results',
    caption: 'VTU results pulled in and kept in your own vault.',
    category: 'Study tools',
  },
  {
    file: '09-cgpa-calculator.png',
    title: 'CGPA Calculator',
    caption: 'SGPA and CGPA worked out from your own marks.',
    category: 'Study tools',
  },
  {
    file: '10-scheme.png',
    title: 'Scheme',
    caption: 'The scheme and syllabus documents for your batch.',
    category: 'Study tools',
  },
  {
    file: '13-daily-revision.png',
    title: 'Daily Revision',
    caption: 'Flashcards and a daily quiz from the topics you ticked off.',
    category: 'Study tools',
  },
  {
    file: '37-flashcards.png',
    title: 'Flashcard decks',
    caption: 'A deck per topic, made for you, with how much of it you know.',
    category: 'Study tools',
  },
  {
    file: '38-flashcard-question.png',
    title: 'Flashcards',
    caption: 'Question on the front — tap to flip.',
    category: 'Study tools',
  },
  {
    file: '39-flashcard-answer.png',
    title: 'Flashcard answer',
    caption: 'Mark it known or difficult, and the hard ones keep coming back.',
    category: 'Study tools',
  },
  {
    file: '40-daily-quiz-list.png',
    title: 'Daily Quiz',
    caption: 'A fresh quiz waiting for every topic you have studied.',
    category: 'Study tools',
  },
  {
    file: '41-daily-quiz.png',
    title: 'Quiz questions',
    caption: 'Ten questions per topic, written from your own syllabus.',
    category: 'Study tools',
  },
  {
    file: '42-quiz-results.png',
    title: 'Quiz results',
    caption: 'Score, accuracy, and exactly which ones you got wrong.',
    category: 'Study tools',
  },
  {
    file: '14-attendance.png',
    title: 'Attendance Tracker',
    caption: 'Per-subject attendance, and how many classes you can still miss.',
    category: 'Study tools',
  },
  {
    file: '15-internal-marks.png',
    title: 'Internal Marks',
    caption: 'IA marks per subject, totalled for you.',
    category: 'Study tools',
  },
  {
    file: '16-study-analytics.png',
    title: 'Study Analytics',
    caption: 'Where your study time actually goes.',
    category: 'Study tools',
  },
  {
    file: '17-syllabus-tracker.png',
    title: 'Syllabus Tracker',
    caption: 'Tick off topics module by module and watch the bar fill.',
    category: 'Study tools',
  },
  {
    file: '18-code-runner.png',
    title: 'Code Runner',
    caption: 'Write and run lab programs on your phone.',
    category: 'Study tools',
  },
  {
    file: '19-gate-calculator.png',
    title: 'GATE Virtual Calculator',
    caption: 'The same on-screen calculator you get in the GATE exam.',
    category: 'Study tools',
  },
  {
    file: '24-tab-ai-professor.png',
    title: 'AI Professor',
    caption: 'Ask anything about your subjects and get answers from your syllabus.',
    category: 'AI',
  },
  {
    file: '23-tab-ai-quiz.png',
    title: 'AI Quiz',
    caption: 'Practice questions generated for the module you are on.',
    category: 'AI',
  },
  {
    file: '29-ai-settings.png',
    title: 'AI Providers',
    caption: 'Bring your own key — Gemini, Groq, Mistral, Cohere and more.',
    category: 'AI',
  },
  {
    file: '43-api-key-setup.png',
    title: 'Add your own key',
    caption: 'Paste a key, test it, and add several for higher limits.',
    category: 'AI',
  },
  {
    file: '44-ai-professor-documents.png',
    title: 'What the AI reads',
    caption: 'Your syllabus and papers, indexed on the phone — pick which to ask about.',
    category: 'AI',
  },
  {
    file: '22-tab-subjects.png',
    title: 'My Subjects',
    caption: 'Your semester subjects, with electives you pick yourself.',
    category: 'Resources',
  },
  {
    file: '25-tab-resources.png',
    title: 'Resources',
    caption: 'Notes, study materials, syllabus, lab manuals and reference books.',
    category: 'Resources',
  },
  {
    file: '26-tab-pyqs.png',
    title: 'Previous Year Papers',
    caption: 'PYQs filtered down to your scheme, branch, semester and subject.',
    category: 'Resources',
  },
  {
    file: '48-pyq-list.png',
    title: 'Papers for one subject',
    caption: 'Every paper VTU has set for that subject, newest first.',
    category: 'Resources',
  },
  {
    file: '49-pyq-paper.png',
    title: 'Read the paper',
    caption: 'The real question paper opens inside the app.',
    category: 'Resources',
  },
  {
    file: '47-syllabus-pdf.png',
    title: 'Syllabus in the app',
    caption: 'Official VTU syllabus documents, no downloads and no browser.',
    category: 'Resources',
  },
  {
    file: '11-project.png',
    title: 'Project Ideas',
    caption: 'Mini and major project ideas for your branch.',
    category: 'Career',
  },
  {
    file: '12-job-updates.png',
    title: 'Job Updates',
    caption: 'Openings and off-campus drives, with a working apply link.',
    category: 'Career',
  },
  {
    file: '30-rewards-credits.png',
    title: 'Rewards & Credits',
    caption: 'Streak, XP, badges and the credits that power the AI features.',
    category: 'Rewards',
  },
  {
    file: '21-refer-and-earn.png',
    title: 'Refer & Earn',
    caption: 'Share an invite card — you both start with free credits.',
    category: 'Rewards',
  },
  {
    file: '31-study-reminders.png',
    title: 'Study Reminders',
    caption: 'A daily nudge at a time that suits you.',
    category: 'Everyday',
  },
  {
    file: '32-widget-shortcuts.png',
    title: 'Widget Shortcuts',
    caption: 'Choose what the home screen widget opens.',
    category: 'Everyday',
  },
  {
    file: '20-sync-my-data.png',
    title: 'Sync my data',
    caption: 'Back everything up to a private folder in your own Google Drive.',
    category: 'Everyday',
  },
  {
    file: '33-light-home-top.png',
    title: 'Home in light mode',
    caption: 'The whole app follows your phone’s light or dark setting.',
    category: 'Light mode',
  },
  {
    file: '34-light-home-features.png',
    title: 'Features in light mode',
    caption: 'Same tools, brighter theme.',
    category: 'Light mode',
  },
  {
    file: '35-light-ai-professor.png',
    title: 'AI Professor in light mode',
    caption: 'Ask your questions in whichever theme you prefer.',
    category: 'Light mode',
  },
  {
    file: '36-light-profile.png',
    title: 'Profile in light mode',
    caption: 'Your details, in the light theme.',
    category: 'Light mode',
  },
]

const idFor = (file: string) => `bundled-${file.replace(/\.png$/, '')}`

/** Every bundled screen, in gallery order, whether switched on or not. */
export const bundledScreenshots: Screenshot[] = SHOTS.map((shot, index) => ({
  id: idFor(shot.file),
  title: shot.title,
  caption: shot.caption,
  image_url: `/app-screens/${shot.file}`,
  category: shot.category,
  is_active: true,
  sort_order: index + 1,
}))

/**
 * The ones switched off until the owner says otherwise. Used as the starting
 * point for Admin -> Screenshots; once they save their own choice, that wins.
 */
export const defaultHiddenScreens: string[] = SHOTS.filter((shot) => shot.hidden).map(
  (shot) => idFor(shot.file),
)
