import { useLangStore } from '../store/lang';

// ─── Strings ──────────────────────────────────────────────────────────────────

const ru = {
  // Onboarding
  skip:                'Пропустить',
  next:                'Далее',
  back:                '←',

  slide1_eyebrow:      'ФИНАНСЫ',
  slide1_headline:     'Деньги\nпод контролем',
  slide1_body:         'Каждая трата зафиксирована.\nВидите баланс в реальном времени.',

  slide2_eyebrow:      'ПРОЗРАЧНОСТЬ',
  slide2_headline:     'Видите,\nкуда уходят',
  slide2_body:         'Kaspi, Halyk, Forte — импорт\nвыписки за 10 секунд.',

  slide3_eyebrow:      'ПЛАНИРОВАНИЕ',
  slide3_headline:     'Бюджет,\nкоторый держит',
  slide3_body:         'Лимиты по категориям.\nУведомление до того, как превысили.',

  // Auth
  auth_signin_tagline: 'Войдите в свой аккаунт',
  auth_signup_tagline: 'Создайте аккаунт',
  auth_signin_tab:     'Войти',
  auth_signup_tab:     'Регистрация',
  google_btn:          'Продолжить с Google',
  or:                  'или',
  field_name:          'Имя',
  field_email:         'Email',
  field_password:      'Пароль',
  submit_signin:       'Войти',
  submit_signup:       'Создать аккаунт',
  err_fill:            'Заполните все поля',
  err_name:            'Введите имя',

  // Tabs
  tab_home:            'Главная',
  tab_leaks:           'Утечки',
  tab_advisor:         'Советник',
  tab_reports:         'Отчёты',
  tab_goals:           'Цели',

  // Dashboard
  greet:               'Привет',
  spend_today_label:   'МОЖНО ПОТРАТИТЬ СЕГОДНЯ',
  spent:               'Потрачено',
  of_limit:            '% лимита',
  safe_save_label:     'Безопасно отложить',
  safe_save_tag:       '20% правило',
  recent_title:        'Последние операции',
  empty_title:         'Нет операций',
  empty_body:          'Добавьте расход или загрузите банковскую выписку.',
  see_all:             'Все операции',
  alert_limit:         'Дневной лимит почти исчерпан',
  alert_details:       'Детали',
  qa_add:              'Добавить',
  qa_receipt:          'Чек',
  qa_statement:        'Выписка',
  qa_report:           'Отчет',
};

type Strings = typeof ru;

const kk: Strings = {
  skip:                'Өткізіп жіберу',
  next:                'Әрі қарай',
  back:                '←',

  slide1_eyebrow:      'ҚАРЖЫ',
  slide1_headline:     'Ақша\nбақылауда',
  slide1_body:         'Әрбір шығыс тіркелген.\nБалансты нақты уақытта көресіз.',

  slide2_eyebrow:      'АШЫҚТЫҚ',
  slide2_headline:     'Қайда кетіп\nжатқанын білесіз',
  slide2_body:         'Kaspi, Halyk, Forte — үзінді\nимпорты 10 секундта.',

  slide3_eyebrow:      'ЖОСПАРЛАУ',
  slide3_headline:     'Ұстап тұратын\nбюджет',
  slide3_body:         'Санат бойынша лимиттер.\nАсып кетпей тұрып хабарлама.',

  auth_signin_tagline: 'Аккаунтыңызға кіріңіз',
  auth_signup_tagline: 'Аккаунт жасаңыз',
  auth_signin_tab:     'Кіру',
  auth_signup_tab:     'Тіркелу',
  google_btn:          'Google арқылы жалғастыру',
  or:                  'немесе',
  field_name:          'Аты',
  field_email:         'Email',
  field_password:      'Құпия сөз',
  submit_signin:       'Кіру',
  submit_signup:       'Аккаунт жасау',
  err_fill:            'Барлық өрісті толтырыңыз',
  err_name:            'Атыңызды енгізіңіз',

  tab_home:            'Басты',
  tab_leaks:           'Ағыстар',
  tab_advisor:         'Кеңесші',
  tab_reports:         'Есептер',
  tab_goals:           'Мақсаттар',

  greet:               'Сәлем',
  spend_today_label:   'БҮГІН ЖҰМСАУҒА БОЛАДЫ',
  spent:               'Жұмсалды',
  of_limit:            '% лимит',
  safe_save_label:     'Қауіпсіз сақтауға болады',
  safe_save_tag:       '20% ереже',
  recent_title:        'Соңғы операциялар',
  empty_title:         'Операция жоқ',
  empty_body:          'Шығысты қосыңыз немесе банк үзіндісін жүктеңіз.',
  see_all:             'Барлық операциялар',
  alert_limit:         'Күндік лимит таусылуға жақын',
  alert_details:       'Толығырақ',
  qa_add:              'Қосу',
  qa_receipt:          'Чек',
  qa_statement:        'Үзінді',
  qa_report:           'Есеп',
};

const en: Strings = {
  skip:                'Skip',
  next:                'Next',
  back:                '←',

  slide1_eyebrow:      'FINANCES',
  slide1_headline:     'Money\nin control',
  slide1_body:         'Every expense logged.\nSee your balance in real time.',

  slide2_eyebrow:      'CLARITY',
  slide2_headline:     'See where\nit all goes',
  slide2_body:         'Kaspi, Halyk, Forte — import\nyour statement in 10 seconds.',

  slide3_eyebrow:      'PLANNING',
  slide3_headline:     'A budget\nthat holds',
  slide3_body:         'Per-category limits.\nNotified before you overspend.',

  auth_signin_tagline: 'Sign in to your account',
  auth_signup_tagline: 'Create an account',
  auth_signin_tab:     'Sign in',
  auth_signup_tab:     'Register',
  google_btn:          'Continue with Google',
  or:                  'or',
  field_name:          'Name',
  field_email:         'Email',
  field_password:      'Password',
  submit_signin:       'Sign in',
  submit_signup:       'Create account',
  err_fill:            'Please fill in all fields',
  err_name:            'Enter your name',

  tab_home:            'Home',
  tab_leaks:           'Leaks',
  tab_advisor:         'Advisor',
  tab_reports:         'Reports',
  tab_goals:           'Goals',

  greet:               'Hello',
  spend_today_label:   'YOU CAN SPEND TODAY',
  spent:               'Spent',
  of_limit:            '% of limit',
  safe_save_label:     'Safe to save',
  safe_save_tag:       '20% rule',
  recent_title:        'Recent transactions',
  empty_title:         'No transactions',
  empty_body:          'Add an expense or upload a bank statement.',
  see_all:             'All transactions',
  alert_limit:         'Daily limit almost reached',
  alert_details:       'Details',
  qa_add:              'Add',
  qa_receipt:          'Receipt',
  qa_statement:        'Statement',
  qa_report:           'Report',
};

const T: Record<string, Strings> = { ru, kk, en };

// ─── Hooks ────────────────────────────────────────────────────────────────────
export function useT(): Strings {
  const { lang } = useLangStore();
  return T[lang] ?? T.ru;
}

export { useLangStore };
export type { Strings };
