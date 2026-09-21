-- =============================================================================
-- SEED REAL LESSON VIDEOS FOR EXISTING COURSES
-- =============================================================================

-- Clean up existing placeholder lessons for these courses so we have clean real curricula
delete from public.lessons where course_id in (
  '7fee1618-6e54-4d65-8569-ce7a974062f6',
  'efd19378-4b2c-4c04-877a-0ecf553c79cf',
  '27d7d8a0-cbc0-4490-8df6-30486fb56971',
  '97a50828-8ca8-449c-b5b2-e213392264e7',
  '7d519cb1-0a14-418e-ab14-a3d28d57a02f'
);

-- 1. React Development
insert into public.lessons (course_id, title, description, video_url, order_index) values
  ('7fee1618-6e54-4d65-8569-ce7a974062f6', 'Introduction to React & Component Architecture', 'Learn the mental model of React, JSX syntax, and how to build reusable components.', 'https://www.youtube.com/watch?v=SqcY0GlETPk', 1),
  ('7fee1618-6e54-4d65-8569-ce7a974062f6', 'React State & Hooks (useState, useEffect)', 'Understand state management, component lifecycle, and modern hooks in React.', 'https://www.youtube.com/watch?v=O6P86uwfdR0', 2),
  ('7fee1618-6e54-4d65-8569-ce7a974062f6', 'Component Props & Reusable UI Patterns', 'Pass data cleanly across components with props, destructuring, and children props.', 'https://www.youtube.com/watch?v=dGcsHMXbSOA', 3),
  ('7fee1618-6e54-4d65-8569-ce7a974062f6', 'Building a Full React Interactive App', 'Synthesize all core concepts to build and deploy an interactive React application.', 'https://www.youtube.com/watch?v=w7ejDZ8SWv8', 4);

-- 2. Full-Stack Web Development
insert into public.lessons (course_id, title, description, video_url, order_index) values
  ('efd19378-4b2c-4c04-877a-0ecf553c79cf', 'How the Modern Web Works', 'A complete walkthrough of client-server architecture, HTTP requests, APIs, and DNS.', 'https://www.youtube.com/watch?v=2JYT5f2isg4', 1),
  ('efd19378-4b2c-4c04-877a-0ecf553c79cf', 'HTML5 & Modern CSS Layouts (Flexbox & Grid)', 'Master modern responsive styling and semantic layouts without external bloat.', 'https://www.youtube.com/watch?v=G3e-cpL7ofc', 2),
  ('efd19378-4b2c-4c04-877a-0ecf553c79cf', 'JavaScript Essentials & DOM Manipulation', 'Async JavaScript, event listeners, promises, and dynamic client-side rendering.', 'https://www.youtube.com/watch?v=W6NZfCO5SIk', 3),
  ('efd19378-4b2c-4c04-877a-0ecf553c79cf', 'RESTful APIs & Backend Architecture', 'Design RESTful endpoints, handle JSON payloads, status codes, and database queries.', 'https://www.youtube.com/watch?v=-MTSQjw5DrM', 4);

-- 3. Next.js Mastery
insert into public.lessons (course_id, title, description, video_url, order_index) values
  ('7d519cb1-0a14-418e-ab14-a3d28d57a02f', 'Next.js App Router & Architecture', 'Deep dive into file-based routing, layout inheritance, and server-side rendering.', 'https://www.youtube.com/watch?v=843nec-IvW0', 1),
  ('7d519cb1-0a14-418e-ab14-a3d28d57a02f', 'Server vs Client Components & Data Fetching', 'Learn when to use Server Components and how caching and streaming work in Next.js.', 'https://www.youtube.com/watch?v=gSSsZReIFRk', 2),
  ('7d519cb1-0a14-418e-ab14-a3d28d57a02f', 'Full-Stack Server Actions & Supabase Integration', 'Implement mutation pipelines with Next.js Server Actions and secure Supabase queries.', 'https://www.youtube.com/watch?v=wm5gMKuwSYk', 3);

-- 4. Python & DSA
insert into public.lessons (course_id, title, description, video_url, order_index) values
  ('27d7d8a0-cbc0-4490-8df6-30486fb56971', 'Python Basics: Variables, Loops & Functions', 'Learn Python syntax, control structures, list comprehensions, and functions.', 'https://www.youtube.com/watch?v=rfscVS0vtbw', 1),
  ('27d7d8a0-cbc0-4490-8df6-30486fb56971', 'Core Data Structures: Lists, Dictionaries & Sets', 'Master data structures in Python and how to choose optimal structures for problem solving.', 'https://www.youtube.com/watch?v=R-HLU9Fl5ug', 2),
  ('27d7d8a0-cbc0-4490-8df6-30486fb56971', 'Algorithms: Big-O, Searching & Sorting', 'Analyze computational complexity and write binary search and sorting algorithms.', 'https://www.youtube.com/watch?v=8hly31xKli0', 3);

-- 5. SQL & Database
insert into public.lessons (course_id, title, description, video_url, order_index) values
  ('97a50828-8ca8-449c-b5b2-e213392264e7', 'SQL Fundamentals & SELECT Queries', 'Learn SQL syntax, filtering, filtering conditions, and table querying.', 'https://www.youtube.com/watch?v=HXV3zeQKqGY', 1),
  ('97a50828-8ca8-449c-b5b2-e213392264e7', 'Relational Database Design & Foreign Keys', 'Normalize databases, enforce referential integrity, and design 1-to-many & many-to-many schemas.', 'https://www.youtube.com/watch?v=ztHopE5Wnpc', 2),
  ('97a50828-8ca8-449c-b5b2-e213392264e7', 'Advanced SQL: JOINs, Aggregations & Grouping', 'Write INNER JOIN, LEFT JOIN, GROUP BY, and HAVING queries like a senior engineer.', 'https://www.youtube.com/watch?v=2Fn0AmtBi-E', 3);
