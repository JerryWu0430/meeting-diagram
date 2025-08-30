'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { RealtimeAgent, RealtimeSession } from '@openai/agents-realtime';
import ReactMarkdown from 'react-markdown';
import mermaid from 'mermaid';

interface VoiceAgentProps {
  className?: string;
}

// Define proper types for transport events
interface TransportEvent {
  type: string;
  delta?: string;
  transcript?: string;
  error?: unknown;
  [key: string]: unknown;
}

interface SessionError {
  type: string;
  error: unknown;
}

// Documentation Links Component
function DocumentationLinks({ summary }: { summary: string }) {
  // Technology detection patterns
  const techPatterns = [
    // Frontend frameworks
    { pattern: /\b(React|React\.js|ReactJS)\b/gi, name: 'React', url: 'https://react.dev/' },
    { pattern: /\b(Vue|Vue\.js|VueJS)\b/gi, name: 'Vue.js', url: 'https://vuejs.org/' },
    { pattern: /\b(Angular|AngularJS)\b/gi, name: 'Angular', url: 'https://angular.io/' },
    { pattern: /\b(Next\.js|NextJS)\b/gi, name: 'Next.js', url: 'https://nextjs.org/' },
    { pattern: /\b(Nuxt\.js|NuxtJS)\b/gi, name: 'Nuxt.js', url: 'https://nuxt.com/' },
    { pattern: /\b(Svelte|SvelteKit)\b/gi, name: 'Svelte', url: 'https://svelte.dev/' },
    
    // Backend frameworks
    { pattern: /\b(Node\.js|NodeJS|Node)\b/gi, name: 'Node.js', url: 'https://nodejs.org/' },
    { pattern: /\b(Express\.js|Express)\b/gi, name: 'Express.js', url: 'https://expressjs.com/' },
    { pattern: /\b(FastAPI|Fast API)\b/gi, name: 'FastAPI', url: 'https://fastapi.tiangolo.com/' },
    { pattern: /\b(Django)\b/gi, name: 'Django', url: 'https://www.djangoproject.com/' },
    { pattern: /\b(Flask)\b/gi, name: 'Flask', url: 'https://flask.palletsprojects.com/' },
    { pattern: /\b(Laravel)\b/gi, name: 'Laravel', url: 'https://laravel.com/' },
    { pattern: /\b(Ruby on Rails|Rails)\b/gi, name: 'Ruby on Rails', url: 'https://rubyonrails.org/' },
    
    // Databases
    { pattern: /\b(PostgreSQL|Postgres)\b/gi, name: 'PostgreSQL', url: 'https://www.postgresql.org/' },
    { pattern: /\b(MySQL)\b/gi, name: 'MySQL', url: 'https://www.mysql.com/' },
    { pattern: /\b(MongoDB)\b/gi, name: 'MongoDB', url: 'https://www.mongodb.com/' },
    { pattern: /\b(Redis)\b/gi, name: 'Redis', url: 'https://redis.io/' },
    { pattern: /\b(SQLite)\b/gi, name: 'SQLite', url: 'https://www.sqlite.org/' },
    
    // Cloud & Infrastructure
    { pattern: /\b(AWS|Amazon Web Services)\b/gi, name: 'AWS', url: 'https://aws.amazon.com/' },
    { pattern: /\b(Azure|Microsoft Azure)\b/gi, name: 'Azure', url: 'https://azure.microsoft.com/' },
    { pattern: /\b(GCP|Google Cloud|Google Cloud Platform)\b/gi, name: 'Google Cloud', url: 'https://cloud.google.com/' },
    { pattern: /\b(Docker)\b/gi, name: 'Docker', url: 'https://www.docker.com/' },
    { pattern: /\b(Kubernetes|K8s)\b/gi, name: 'Kubernetes', url: 'https://kubernetes.io/' },
    { pattern: /\b(Terraform)\b/gi, name: 'Terraform', url: 'https://www.terraform.io/' },
    
    // Programming Languages
    { pattern: /\b(JavaScript|JS)\b/gi, name: 'JavaScript', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript' },
    { pattern: /\b(TypeScript|TS)\b/gi, name: 'TypeScript', url: 'https://www.typescriptlang.org/' },
    { pattern: /\b(Python)\b/gi, name: 'Python', url: 'https://www.python.org/' },
    { pattern: /\b(Java)\b/gi, name: 'Java', url: 'https://www.oracle.com/java/' },
    { pattern: /\b(C#|CSharp)\b/gi, name: 'C#', url: 'https://docs.microsoft.com/en-us/dotnet/csharp/' },
    { pattern: /\b(Go|Golang)\b/gi, name: 'Go', url: 'https://golang.org/' },
    { pattern: /\b(Rust)\b/gi, name: 'Rust', url: 'https://www.rust-lang.org/' },
    
    // Tools & Libraries
    { pattern: /\b(Git)\b/gi, name: 'Git', url: 'https://git-scm.com/' },
    { pattern: /\b(npm|NPM)\b/gi, name: 'npm', url: 'https://www.npmjs.com/' },
    { pattern: /\b(yarn|Yarn)\b/gi, name: 'Yarn', url: 'https://yarnpkg.com/' },
    { pattern: /\b(Webpack)\b/gi, name: 'Webpack', url: 'https://webpack.js.org/' },
    { pattern: /\b(Vite)\b/gi, name: 'Vite', url: 'https://vitejs.dev/' },
    { pattern: /\b(Tailwind CSS|Tailwind)\b/gi, name: 'Tailwind CSS', url: 'https://tailwindcss.com/' },
    { pattern: /\b(Bootstrap)\b/gi, name: 'Bootstrap', url: 'https://getbootstrap.com/' },
    
    // APIs & Services
    { pattern: /\b(REST API|REST)\b/gi, name: 'REST API', url: 'https://restfulapi.net/' },
    { pattern: /\b(GraphQL)\b/gi, name: 'GraphQL', url: 'https://graphql.org/' },
    
    // Testing & Quality
    { pattern: /\b(Jest)\b/gi, name: 'Jest', url: 'https://jestjs.io/' },
    { pattern: /\b(Cypress)\b/gi, name: 'Cypress', url: 'https://docs.cypress.io/' },
    { pattern: /\b(Playwright)\b/gi, name: 'Playwright', url: 'https://playwright.dev/' },
    { pattern: /\b(ESLint)\b/gi, name: 'ESLint', url: 'https://eslint.org/' },
    { pattern: /\b(Prettier)\b/gi, name: 'Prettier', url: 'https://prettier.io/' },
    
    // State Management
    { pattern: /\b(Redux|Redux Toolkit)\b/gi, name: 'Redux', url: 'https://redux.js.org/' },
    { pattern: /\b(Zustand)\b/gi, name: 'Zustand', url: 'https://zustand-demo.pmnd.rs/' },
    { pattern: /\b(Recoil)\b/gi, name: 'Recoil', url: 'https://recoiljs.org/' },
    { pattern: /\b(Jotai)\b/gi, name: 'Jotai', url: 'https://jotai.org/' },
    
    // UI Libraries
    { pattern: /\b(Material-UI|MUI)\b/gi, name: 'Material-UI', url: 'https://mui.com/' },
    { pattern: /\b(Chakra UI|Chakra)\b/gi, name: 'Chakra UI', url: 'https://chakra-ui.com/' },
    { pattern: /\b(Ant Design|Antd)\b/gi, name: 'Ant Design', url: 'https://ant.design/' },
    { pattern: /\b(Headless UI)\b/gi, name: 'Headless UI', url: 'https://headlessui.com/' },
  ];

  // Extract technologies mentioned in the summary
  const extractTechnologies = (text: string) => {
    const found = new Set<string>();
    const links = [];
    
    for (const tech of techPatterns) {
      if (tech.pattern.test(text)) {
        // Avoid duplicates and ensure we get the best match
        if (!found.has(tech.name)) {
          found.add(tech.name);
          links.push({ name: tech.name, url: tech.url });
        }
      }
    }
    
    // Sort by category for better organization
    return links.sort((a, b) => a.name.localeCompare(b.name));
  };

  const techLinks = extractTechnologies(summary);
  
  if (techLinks.length === 0) return null;

  return (
    <div className="border-t pt-3">
      <h4 className="text-xs font-medium text-gray-600 mb-2">📚 Related Documentation</h4>
      <div className="flex flex-wrap gap-2">
        {techLinks.map((link, index) => (
          <a
            key={index}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
          >
            {link.name}
            <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        ))}
      </div>
    </div>
  );
}

// Tech Stack Links Component - Clean, minimal display for AI/API technologies
function TechStackLinks({ summary }: { summary: string }) {
  // AI/API specific technology patterns
  const techStackPatterns = [
    // AI & Machine Learning
    { pattern: /\b(OpenAI|GPT|ChatGPT|GPT-4|GPT-3)\b/gi, name: 'OpenAI', url: 'https://platform.openai.com/docs' },
    { pattern: /\b(Anthropic|Claude)\b/gi, name: 'Anthropic Claude', url: 'https://docs.anthropic.com/' },
    { pattern: /\b(Google AI|Gemini|PaLM)\b/gi, name: 'Google AI', url: 'https://ai.google.dev/' },
    { pattern: /\b(Microsoft AI|Azure OpenAI)\b/gi, name: 'Microsoft AI', url: 'https://azure.microsoft.com/en-us/products/ai-services/openai-service' },
    { pattern: /\b(Meta AI|LLaMA)\b/gi, name: 'Meta AI', url: 'https://ai.meta.com/' },
    { pattern: /\b(Hugging Face|Transformers)\b/gi, name: 'Hugging Face', url: 'https://huggingface.co/docs' },
    { pattern: /\b(Cohere)\b/gi, name: 'Cohere', url: 'https://docs.cohere.com/' },
    { pattern: /\b(Replicate)\b/gi, name: 'Replicate', url: 'https://replicate.com/docs' },
    
    // API Platforms & Services
    { pattern: /\b(Prolific)\b/gi, name: 'Prolific', url: 'https://docs.prolific.co/' },
    { pattern: /\b(Stripe)\b/gi, name: 'Stripe', url: 'https://stripe.com/docs' },
    { pattern: /\b(Twilio)\b/gi, name: 'Twilio', url: 'https://www.twilio.com/docs' },
    { pattern: /\b(SendGrid)\b/gi, name: 'SendGrid', url: 'https://sendgrid.com/docs/' },
    { pattern: /\b(Auth0)\b/gi, name: 'Auth0', url: 'https://auth0.com/docs' },
    { pattern: /\b(Firebase)\b/gi, name: 'Firebase', url: 'https://firebase.google.com/docs' },
    { pattern: /\b(Supabase)\b/gi, name: 'Supabase', url: 'https://supabase.com/docs' },
    { pattern: /\b(PlanetScale)\b/gi, name: 'PlanetScale', url: 'https://planetscale.com/docs' },
    { pattern: /\b(Vercel)\b/gi, name: 'Vercel', url: 'https://vercel.com/docs' },
    { pattern: /\b(Netlify)\b/gi, name: 'Netlify', url: 'https://docs.netlify.com/' },
    
    // Data & Analytics APIs
    { pattern: /\b(Google Analytics|GA4)\b/gi, name: 'Google Analytics', url: 'https://developers.google.com/analytics' },
    { pattern: /\b(Mixpanel)\b/gi, name: 'Mixpanel', url: 'https://developer.mixpanel.com/' },
    { pattern: /\b(Amplitude)\b/gi, name: 'Amplitude', url: 'https://www.docs.developers.amplitude.com/' },
    { pattern: /\b(Segment)\b/gi, name: 'Segment', url: 'https://segment.com/docs/' },
    { pattern: /\b(PostHog)\b/gi, name: 'PostHog', url: 'https://posthog.com/docs' },
    
    // Communication APIs
    { pattern: /\b(Slack API)\b/gi, name: 'Slack API', url: 'https://api.slack.com/' },
    { pattern: /\b(Discord API)\b/gi, name: 'Discord API', url: 'https://discord.com/developers/docs' },
    { pattern: /\b(Microsoft Teams|Teams API)\b/gi, name: 'Microsoft Teams API', url: 'https://docs.microsoft.com/en-us/graph/api/resources/teams-api-overview' },
    { pattern: /\b(Zoom API)\b/gi, name: 'Zoom API', url: 'https://marketplace.zoom.us/docs/api-reference' },
    
    // Development Tools & APIs
    { pattern: /\b(GitHub API)\b/gi, name: 'GitHub API', url: 'https://docs.github.com/en/rest' },
    { pattern: /\b(GitLab API)\b/gi, name: 'GitLab API', url: 'https://docs.gitlab.com/ee/api/' },
    { pattern: /\b(Jira API)\b/gi, name: 'Jira API', url: 'https://developer.atlassian.com/cloud/jira/platform/rest/v3/' },
    { pattern: /\b(Linear API)\b/gi, name: 'Linear API', url: 'https://developers.linear.app/docs' },
    { pattern: /\b(Notion API)\b/gi, name: 'Notion API', url: 'https://developers.notion.com/' },
    { pattern: /\b(Airtable API)\b/gi, name: 'Airtable API', url: 'https://airtable.com/developers/web/api/introduction' },
    
    // Payment & Financial APIs
    { pattern: /\b(PayPal API)\b/gi, name: 'PayPal API', url: 'https://developer.paypal.com/docs/' },
    { pattern: /\b(Square API)\b/gi, name: 'Square API', url: 'https://developer.squareup.com/docs' },
    { pattern: /\b(Plaid)\b/gi, name: 'Plaid', url: 'https://plaid.com/docs/' },
    
    // Search & Content APIs
    { pattern: /\b(Algolia)\b/gi, name: 'Algolia', url: 'https://www.algolia.com/doc/' },
    { pattern: /\b(Elasticsearch)\b/gi, name: 'Elasticsearch', url: 'https://www.elastic.co/guide/index.html' },
    { pattern: /\b(Contentful)\b/gi, name: 'Contentful', url: 'https://www.contentful.com/developers/docs/' },
    { pattern: /\b(Sanity)\b/gi, name: 'Sanity', url: 'https://www.sanity.io/docs' },
  ];

  // Extract tech stack technologies
  const extractTechStack = (text: string) => {
    const found = new Set<string>();
    const links = [];
    
    for (const tech of techStackPatterns) {
      if (tech.pattern.test(text)) {
        if (!found.has(tech.name)) {
          found.add(tech.name);
          links.push({ name: tech.name, url: tech.url });
        }
      }
    }
    
    return links.sort((a, b) => a.name.localeCompare(b.name));
  };

  const techStackLinks = extractTechStack(summary);
  
  if (techStackLinks.length === 0) return null;

  return (
    <div className="border-t pt-3">
      <h4 className="text-xs font-medium text-gray-600 mb-2">🔗 Tech Stack & APIs</h4>
      <div className="flex flex-wrap gap-1">
        {techStackLinks.map((link, index) => (
          <a
            key={index}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-2 py-1 text-xs bg-gray-50 text-gray-600 rounded border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-colors"
          >
            {link.name}
            <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        ))}
      </div>
    </div>
  );
}

// API Documentation Links Component - Clean display for API-specific documentation
function APIDocumentationLinks({ summary }: { summary: string }) {
  // API-specific patterns for documentation
  const apiPatterns = [
    // AI & ML APIs
    { pattern: /\b(OpenAI|GPT|ChatGPT|GPT-4|GPT-3)\b/gi, name: 'OpenAI API', url: 'https://platform.openai.com/docs', category: 'AI/ML' },
    { pattern: /\b(Anthropic|Claude)\b/gi, name: 'Anthropic Claude API', url: 'https://docs.anthropic.com/', category: 'AI/ML' },
    { pattern: /\b(Google AI|Gemini|PaLM)\b/gi, name: 'Google AI API', url: 'https://ai.google.dev/', category: 'AI/ML' },
    { pattern: /\b(Azure OpenAI)\b/gi, name: 'Azure OpenAI API', url: 'https://azure.microsoft.com/en-us/products/ai-services/openai-service', category: 'AI/ML' },
    { pattern: /\b(Hugging Face|Transformers)\b/gi, name: 'Hugging Face API', url: 'https://huggingface.co/docs', category: 'AI/ML' },
    
    // Development & Infrastructure APIs
    { pattern: /\b(GitHub API)\b/gi, name: 'GitHub API', url: 'https://docs.github.com/en/rest', category: 'Development' },
    { pattern: /\b(Vercel API)\b/gi, name: 'Vercel API', url: 'https://vercel.com/docs', category: 'Infrastructure' },
    { pattern: /\b(Netlify API)\b/gi, name: 'Netlify API', url: 'https://docs.netlify.com/', category: 'Infrastructure' },
    { pattern: /\b(Docker API)\b/gi, name: 'Docker API', url: 'https://docs.docker.com/engine/api/', category: 'Infrastructure' },
    { pattern: /\b(Kubernetes API)\b/gi, name: 'Kubernetes API', url: 'https://kubernetes.io/docs/reference/', category: 'Infrastructure' },
    
    // Frontend Frameworks & Libraries
    { pattern: /\b(React|React\.js|ReactJS)\b/gi, name: 'React', url: 'https://react.dev/', category: 'Frontend' },
    { pattern: /\b(Vue|Vue\.js|VueJS)\b/gi, name: 'Vue.js', url: 'https://vuejs.org/', category: 'Frontend' },
    { pattern: /\b(Angular|AngularJS)\b/gi, name: 'Angular', url: 'https://angular.io/', category: 'Frontend' },
    { pattern: /\b(Next\.js|NextJS)\b/gi, name: 'Next.js', url: 'https://nextjs.org/', category: 'Frontend' },
    { pattern: /\b(Nuxt\.js|NuxtJS)\b/gi, name: 'Nuxt.js', url: 'https://nuxt.com/', category: 'Frontend' },
    { pattern: /\b(Svelte|SvelteKit)\b/gi, name: 'Svelte', url: 'https://svelte.dev/', category: 'Frontend' },
    
    // Research & Data Collection APIs
    { pattern: /\b(Prolific)\b/gi, name: 'Prolific API', url: 'https://docs.prolific.co/', category: 'Research' },
    
    // Database & Storage APIs
    { pattern: /\b(PostgreSQL|Postgres)\b/gi, name: 'PostgreSQL API', url: 'https://www.postgresql.org/docs/', category: 'Database' },
    { pattern: /\b(MongoDB)\b/gi, name: 'MongoDB API', url: 'https://docs.mongodb.com/', category: 'Database' },
    { pattern: /\b(Redis)\b/gi, name: 'Redis API', url: 'https://redis.io/documentation', category: 'Database' },
    { pattern: /\b(Firebase)\b/gi, name: 'Firebase API', url: 'https://firebase.google.com/docs', category: 'Database' },
    { pattern: /\b(Supabase)\b/gi, name: 'Supabase API', url: 'https://supabase.com/docs', category: 'Database' },
    
    // Communication & Integration APIs
    { pattern: /\b(Slack API)\b/gi, name: 'Slack API', url: 'https://api.slack.com/', category: 'Communication' },
    { pattern: /\b(Discord API)\b/gi, name: 'Discord API', url: 'https://discord.com/developers/docs', category: 'Communication' },
    { pattern: /\b(Twilio)\b/gi, name: 'Twilio API', url: 'https://www.twilio.com/docs', category: 'Communication' },
    { pattern: /\b(SendGrid)\b/gi, name: 'SendGrid API', url: 'https://sendgrid.com/docs/', category: 'Communication' },
    
    // Payment & Financial APIs
    { pattern: /\b(Stripe)\b/gi, name: 'Stripe API', url: 'https://stripe.com/docs', category: 'Payment' },
    { pattern: /\b(PayPal API)\b/gi, name: 'PayPal API', url: 'https://developer.paypal.com/docs/', category: 'Payment' },
    { pattern: /\b(Plaid)\b/gi, name: 'Plaid API', url: 'https://plaid.com/docs/', category: 'Payment' },
    
    // Analytics & Monitoring APIs
    { pattern: /\b(Google Analytics|GA4)\b/gi, name: 'Google Analytics API', url: 'https://developers.google.com/analytics', category: 'Analytics' },
    { pattern: /\b(Mixpanel)\b/gi, name: 'Mixpanel API', url: 'https://developer.mixpanel.com/', category: 'Analytics' },
    { pattern: /\b(Amplitude)\b/gi, name: 'Amplitude API', url: 'https://www.docs.developers.amplitude.com/', category: 'Analytics' },
    
    // Content & Search APIs
    { pattern: /\b(Algolia)\b/gi, name: 'Algolia API', url: 'https://www.algolia.com/doc/', category: 'Search' },
    { pattern: /\b(Elasticsearch)\b/gi, name: 'Elasticsearch API', url: 'https://www.elastic.co/guide/index.html', category: 'Search' },
    { pattern: /\b(Contentful)\b/gi, name: 'Contentful API', url: 'https://www.contentful.com/developers/docs/', category: 'Search' },
    { pattern: /\b(Sanity)\b/gi, name: 'Sanity API', url: 'https://www.sanity.io/docs', category: 'Search' },
    
    // Backend & Server APIs
    { pattern: /\b(Node\.js|NodeJS|Node)\b/gi, name: 'Node.js', url: 'https://nodejs.org/en/docs/', category: 'Backend' },
    { pattern: /\b(Express\.js|Express)\b/gi, name: 'Express.js', url: 'https://expressjs.com/', category: 'Backend' },
    { pattern: /\b(FastAPI|Fast API)\b/gi, name: 'FastAPI', url: 'https://fastapi.tiangolo.com/', category: 'Backend' },
    { pattern: /\b(Django)\b/gi, name: 'Django', url: 'https://docs.djangoproject.com/', category: 'Backend' },
    { pattern: /\b(Flask)\b/gi, name: 'Flask', url: 'https://flask.palletsprojects.com/', category: 'Backend' },
    { pattern: /\b(Laravel)\b/gi, name: 'Laravel', url: 'https://laravel.com/docs/', category: 'Backend' },
    { pattern: /\b(Ruby on Rails|Rails)\b/gi, name: 'Ruby on Rails', url: 'https://guides.rubyonrails.org/', category: 'Backend' },
    
    // Authentication & Security APIs
    { pattern: /\b(Auth0)\b/gi, name: 'Auth0 API', url: 'https://auth0.com/docs', category: 'Authentication' },
    { pattern: /\b(Okta)\b/gi, name: 'Okta API', url: 'https://developer.okta.com/', category: 'Authentication' },
    { pattern: /\b(Clerk)\b/gi, name: 'Clerk API', url: 'https://clerk.com/docs', category: 'Authentication' },
  ];

  // Extract API technologies mentioned in the summary
  const extractAPITechnologies = (text: string) => {
    const found = new Set<string>();
    const links = [];
    
    for (const api of apiPatterns) {
      if (api.pattern.test(text)) {
        if (!found.has(api.name)) {
          found.add(api.name);
          links.push({ name: api.name, url: api.url, category: api.category });
        }
      }
    }
    
    return links.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
  };

  const apiLinks = extractAPITechnologies(summary);
  
  if (apiLinks.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2">🔍</div>
        <p className="text-gray-500 text-sm">No specific APIs detected in this summary</p>
        <p className="text-gray-400 text-xs mt-1">Try discussing specific technologies or services</p>
      </div>
    );
  }

  // Group by category
  const groupedLinks = apiLinks.reduce((acc, link) => {
    if (!acc[link.category]) {
      acc[link.category] = [];
    }
    acc[link.category].push(link);
    return acc;
  }, {} as Record<string, typeof apiLinks>);

  return (
    <div className="space-y-3">
      {Object.entries(groupedLinks).map(([category, links]) => (
        <div key={category}>
          <h4 className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">{category}</h4>
          <div className="flex flex-wrap gap-1 mb-3">
            {links.map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-colors"
              >
                {link.name}
                <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Helper function to extract API links count
function extractAPILinks(summary: string): Array<{name: string, url: string, category: string}> {
  const apiPatterns = [
    { pattern: /\b(OpenAI|GPT|ChatGPT|GPT-4|GPT-3)\b/gi, name: 'OpenAI API', url: 'https://platform.openai.com/docs', category: 'AI/ML' },
    { pattern: /\b(Anthropic|Claude)\b/gi, name: 'Anthropic Claude API', url: 'https://docs.anthropic.com/', category: 'AI/ML' },
    { pattern: /\b(Google AI|Gemini|PaLM)\b/gi, name: 'Google AI API', url: 'https://ai.google.dev/', category: 'AI/ML' },
    { pattern: /\b(Azure OpenAI)\b/gi, name: 'Azure OpenAI API', url: 'https://azure.microsoft.com/en-us/products/ai-services/openai-service', category: 'AI/ML' },
    { pattern: /\b(Hugging Face|Transformers)\b/gi, name: 'Hugging Face API', url: 'https://huggingface.co/docs', category: 'AI/ML' },
    { pattern: /\b(GitHub API)\b/gi, name: 'GitHub API', url: 'https://docs.github.com/en/rest', category: 'Development' },
    { pattern: /\b(Vercel API)\b/gi, name: 'Vercel API', url: 'https://vercel.com/docs', category: 'Infrastructure' },
    { pattern: /\b(Netlify API)\b/gi, name: 'Netlify API', url: 'https://docs.netlify.com/', category: 'Infrastructure' },
    { pattern: /\b(Docker API)\b/gi, name: 'Docker API', url: 'https://docs.docker.com/engine/api/', category: 'Infrastructure' },
    { pattern: /\b(Kubernetes API)\b/gi, name: 'Kubernetes API', url: 'https://kubernetes.io/docs/reference/', category: 'Infrastructure' },
    
    // Frontend Frameworks & Libraries
    { pattern: /\b(React|React\.js|ReactJS)\b/gi, name: 'React', url: 'https://react.dev/', category: 'Frontend' },
    { pattern: /\b(Vue|Vue\.js|VueJS)\b/gi, name: 'Vue.js', url: 'https://vuejs.org/', category: 'Frontend' },
    { pattern: /\b(Angular|AngularJS)\b/gi, name: 'Angular', url: 'https://angular.io/', category: 'Frontend' },
    { pattern: /\b(Next\.js|NextJS)\b/gi, name: 'Next.js', url: 'https://nextjs.org/', category: 'Frontend' },
    { pattern: /\b(Nuxt\.js|NuxtJS)\b/gi, name: 'Nuxt.js', url: 'https://nuxt.com/', category: 'Frontend' },
    { pattern: /\b(Svelte|SvelteKit)\b/gi, name: 'Svelte', url: 'https://svelte.dev/', category: 'Frontend' },
    
    // Research & Data Collection APIs
    { pattern: /\b(Prolific)\b/gi, name: 'Prolific API', url: 'https://docs.prolific.co/', category: 'Research' },
    { pattern: /\b(PostgreSQL|Postgres)\b/gi, name: 'PostgreSQL API', url: 'https://www.postgresql.org/docs/', category: 'Database' },
    { pattern: /\b(MongoDB)\b/gi, name: 'MongoDB API', url: 'https://docs.mongodb.com/', category: 'Database' },
    { pattern: /\b(Redis)\b/gi, name: 'Redis API', url: 'https://redis.io/documentation', category: 'Database' },
    { pattern: /\b(Firebase)\b/gi, name: 'Firebase API', url: 'https://firebase.google.com/docs', category: 'Database' },
    { pattern: /\b(Supabase)\b/gi, name: 'Supabase API', url: 'https://supabase.com/docs', category: 'Database' },
    { pattern: /\b(Slack API)\b/gi, name: 'Slack API', url: 'https://api.slack.com/', category: 'Communication' },
    { pattern: /\b(Discord API)\b/gi, name: 'Discord API', url: 'https://discord.com/developers/docs', category: 'Communication' },
    { pattern: /\b(Twilio)\b/gi, name: 'Twilio API', url: 'https://www.twilio.com/docs', category: 'Communication' },
    { pattern: /\b(SendGrid)\b/gi, name: 'SendGrid API', url: 'https://sendgrid.com/docs/', category: 'Communication' },
    { pattern: /\b(Stripe)\b/gi, name: 'Stripe API', url: 'https://stripe.com/docs', category: 'Payment' },
    { pattern: /\b(PayPal API)\b/gi, name: 'PayPal API', url: 'https://developer.paypal.com/docs/', category: 'Payment' },
    { pattern: /\b(Plaid)\b/gi, name: 'Plaid API', url: 'https://plaid.com/docs/', category: 'Payment' },
    { pattern: /\b(Google Analytics|GA4)\b/gi, name: 'Google Analytics API', url: 'https://developers.google.com/analytics', category: 'Analytics' },
    { pattern: /\b(Mixpanel)\b/gi, name: 'Mixpanel API', url: 'https://developer.mixpanel.com/', category: 'Analytics' },
    { pattern: /\b(Amplitude)\b/gi, name: 'Amplitude API', url: 'https://www.docs.developers.amplitude.com/', category: 'Analytics' },
    { pattern: /\b(Algolia)\b/gi, name: 'Algolia API', url: 'https://www.algolia.com/doc/', category: 'Search' },
    { pattern: /\b(Elasticsearch)\b/gi, name: 'Elasticsearch API', url: 'https://www.elastic.co/guide/index.html', category: 'Search' },
    { pattern: /\b(Contentful)\b/gi, name: 'Contentful API', url: 'https://www.contentful.com/developers/docs/', category: 'Search' },
    { pattern: /\b(Sanity)\b/gi, name: 'Sanity API', url: 'https://www.sanity.io/docs', category: 'Search' },
    
    // Backend & Server APIs
    { pattern: /\b(Node\.js|NodeJS|Node)\b/gi, name: 'Node.js', url: 'https://nodejs.org/en/docs/', category: 'Backend' },
    { pattern: /\b(Express\.js|Express)\b/gi, name: 'Express.js', url: 'https://expressjs.com/', category: 'Backend' },
    { pattern: /\b(FastAPI|Fast API)\b/gi, name: 'FastAPI', url: 'https://fastapi.tiangolo.com/', category: 'Backend' },
    { pattern: /\b(Django)\b/gi, name: 'Django', url: 'https://docs.djangoproject.com/', category: 'Backend' },
    { pattern: /\b(Flask)\b/gi, name: 'Flask', url: 'https://flask.palletsprojects.com/', category: 'Backend' },
    { pattern: /\b(Laravel)\b/gi, name: 'Laravel', url: 'https://laravel.com/docs/', category: 'Backend' },
    { pattern: /\b(Ruby on Rails|Rails)\b/gi, name: 'Ruby on Rails', url: 'https://guides.rubyonrails.org/', category: 'Backend' },
    
    // Authentication & Security APIs
    { pattern: /\b(Auth0)\b/gi, name: 'Auth0 API', url: 'https://auth0.com/docs', category: 'Authentication' },
    { pattern: /\b(Okta)\b/gi, name: 'Okta API', url: 'https://developer.okta.com/', category: 'Authentication' },
    { pattern: /\b(Clerk)\b/gi, name: 'Clerk API', url: 'https://clerk.com/docs', category: 'Authentication' },
  ];

  const found = new Set<string>();
  const links = [];
  
  for (const api of apiPatterns) {
    if (api.pattern.test(summary)) {
      if (!found.has(api.name)) {
        found.add(api.name);
        links.push({ name: api.name, url: api.url, category: api.category });
      }
    }
  }
  
  return links;
}

// MVP Generation Prompt Component - Creates development prompts for Cursor
function MVPGenerationPrompt({ 
  summary, 
  diagram, 
  transcript, 
  meetingType 
}: { 
  summary: string; 
  diagram: string; 
  transcript: string; 
  meetingType: string; 
}) {
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate comprehensive MVP prompt
  const generateMVPPrompt = useCallback(async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-mvp-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          summary, 
          diagram, 
          transcript, 
          meetingType 
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setGeneratedPrompt(data.prompt || 'Failed to generate prompt');
      } else {
        setGeneratedPrompt('Error: Failed to generate MVP prompt');
      }
    } catch {
      setGeneratedPrompt('Error: Failed to generate MVP prompt');
    } finally {
      setIsGenerating(false);
    }
  }, [summary, diagram, transcript, meetingType]);

  // Copy prompt to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  // Auto-generate prompt when component mounts
  useEffect(() => {
    if (!generatedPrompt && !isGenerating) {
      generateMVPPrompt();
    }
  }, [generateMVPPrompt, generatedPrompt, isGenerating]);

  return (
    <div className="space-y-3">
      {!generatedPrompt ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto mb-2"></div>
          <p className="text-gray-500 text-sm">Generating MVP prompt...</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-medium text-gray-600">Development Prompt for Cursor</h4>
            <button
              onClick={copyToClipboard}
              className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 px-2 py-1 rounded transition-colors"
            >
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </button>
          </div>
          
          <div className="bg-gray-50 p-3 rounded border max-h-48 overflow-y-auto">
            <pre className="text-xs text-gray-800 whitespace-pre-wrap font-mono">
              {generatedPrompt}
            </pre>
          </div>
          
          <div className="text-xs text-gray-500">
            <p>💡 <strong>How to use:</strong></p>
            <ol className="list-decimal list-inside mt-1 space-y-1">
              <li>Copy the prompt above</li>
              <li>Open Cursor and create a new project</li>
              <li>Paste the prompt and press Cmd/Ctrl + K</li>
              <li>Cursor will generate your MVP code!</li>
            </ol>
          </div>
          
          <button
            onClick={generateMVPPrompt}
            disabled={isGenerating}
            className="w-full text-xs bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-3 py-2 rounded transition-colors"
          >
            {isGenerating ? 'Regenerating...' : 'Regenerate Prompt'}
          </button>
        </>
      )}
    </div>
  );
}

export default function VoiceAgent({ className = '' }: VoiceAgentProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [transcriptSegments, setTranscriptSegments] = useState<Array<{id: string, text: string, timestamp: Date}>>([]);
  const [summary, setSummary] = useState<string>('');
  const [diagram, setDiagram] = useState<string>('');
  const [isListening, setIsListening] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isGeneratingDiagram, setIsGeneratingDiagram] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'reconnecting'>('disconnected');
  
  const sessionRef = useRef<RealtimeSession | null>(null);
  const agentRef = useRef<RealtimeAgent | null>(null);
  const summaryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const diagramTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const segmentIdRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // State for diagram rendering
  const [diagramSvg, setDiagramSvg] = useState<string>('');
  const [diagramError, setDiagramError] = useState<string>('');
  const [diagramVersion, setDiagramVersion] = useState<number>(0);
  
  // State for meeting type selection
  const [meetingType, setMeetingType] = useState<string>('general');
  const [availableMeetingTypes, setAvailableMeetingTypes] = useState<Array<{id: string, name: string, description: string}>>([]);

  // Function to get complete transcript from all segments
  const getCompleteTranscript = useCallback(() => {
    if (transcriptSegments.length === 0) return transcript;
    
    // Combine all transcript segments with timestamps for context
    const completeTranscript = transcriptSegments
      .map((segment, index) => `[Segment ${index + 1} - ${segment.timestamp.toLocaleTimeString()}]: ${segment.text}`)
      .join('\n\n');
    
    // Add current transcript if it exists and is different from the last segment
    if (transcript && transcript.trim() && 
        (!transcriptSegments.length || transcriptSegments[transcriptSegments.length - 1].text !== transcript.trim())) {
      return completeTranscript + `\n\n[Current]: ${transcript}`;
    }
    
    return completeTranscript;
  }, [transcript, transcriptSegments]);

  // Function to generate summary from transcript
  const generateSummary = useCallback(async (text: string) => {
    if (!text.trim() || text.length < 50 || !isConnected) return; // Only summarize if there's substantial content and still connected
    
    setIsGeneratingSummary(true);
    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript: text, meetingType }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const newSummary = data.summary || 'Summary generated successfully';
        setSummary(newSummary);
      } else {
        console.error('Failed to generate summary');
      }
    } catch (err) {
      console.error('Error generating summary:', err);
    } finally {
      setIsGeneratingSummary(false);
    }
  }, [meetingType, isConnected]);

  // Function to generate diagram from transcript
  const generateDiagram = useCallback(async (text: string) => {
    if (!text.trim() || text.length < 100 || !isConnected) return; // Only generate diagram if there's substantial content and still connected
    
    setIsGeneratingDiagram(true);
    setDiagramError(''); // Clear any previous errors
    
    try {
      const requestBody = { 
        transcript: text,
        summary: summary || undefined, // Include current summary if available
        previousDiagram: diagram || undefined // Include previous diagram as context
      };
      
      console.log('Generating diagram with context:', {
        hasPreviousDiagram: !!diagram,
        transcriptLength: text.length,
        hasSummary: !!summary
      });
      
      const response = await fetch('/api/generate-diagram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (response.ok) {
        const data = await response.json();
        const diagramCode = data.diagram;
        
        if (diagramCode) {
          // Generate unique ID for this diagram
          const diagramId = `diagram-${Date.now()}`;
          
          try {
            // Log the diagram code for debugging
            console.log('Attempting to render diagram:', diagramCode);
            
            // Render the Mermaid diagram
            const { svg } = await mermaid.render(diagramId, diagramCode);
            
            console.log('Mermaid rendering successful');
            
            // Use React state instead of direct DOM manipulation
            setDiagramSvg(svg);
            setDiagram(diagramCode);
            setDiagramError('');
            setDiagramVersion(prev => prev + 1);
                    } catch (mermaidError) {
            console.error('Mermaid rendering error:', mermaidError);
            console.error('Invalid diagram code:', diagramCode);
            
            // Try a fallback: clean the diagram code and try again
            try {
              console.log('Attempting fallback rendering with cleaned code...');
              const cleanedCode = diagramCode
                .replace(/\r\n/g, '\n')
                .replace(/\n\s*\n\s*\n/g, '\n\n')
                .trim();
              
              const fallbackId = `diagram-fallback-${Date.now()}`;
              const { svg } = await mermaid.render(fallbackId, cleanedCode);
              
              console.log('Fallback rendering successful');
              setDiagramSvg(svg);
              setDiagram(cleanedCode);
              setDiagramError('');
              setDiagramVersion(prev => prev + 1);
            } catch (fallbackError) {
              console.error('Fallback rendering also failed:', fallbackError);
              
              // Set error state instead of manipulating DOM
              setDiagramSvg('');
              setDiagramError(`Failed to render diagram. The generated Mermaid syntax may be invalid.\n\nRaw diagram code:\n${diagramCode}`);
            }
          }
        }
      } else {
        console.error('Failed to generate diagram');
        setDiagramError('Failed to generate diagram from the API.');
      }
    } catch (err) {
      console.error('Error generating diagram:', err);
      setDiagramError('Error occurred while generating diagram.');
    } finally {
      setIsGeneratingDiagram(false);
    }
  }, [summary, diagram, isConnected]);

  // Debounced summary generation (diagram now manual)
  useEffect(() => {
    if (summaryTimeoutRef.current) {
      clearTimeout(summaryTimeoutRef.current);
    }
    
    if ((transcript.length > 0 || transcriptSegments.length > 0) && isConnected) {
      const completeTranscript = getCompleteTranscript();
      
      summaryTimeoutRef.current = setTimeout(() => {
        // Only generate summary automatically, diagram is now manual
        if (isConnected) {
          generateSummary(completeTranscript);
        }
      }, 3000); // Wait 3 seconds after transcript stops updating - only summary auto-generates
    }
    
    return () => {
      if (summaryTimeoutRef.current) {
        clearTimeout(summaryTimeoutRef.current);
      }
    };
  }, [transcript, transcriptSegments, generateSummary, getCompleteTranscript, isConnected]);

  // Clear timeouts when connection status changes to disconnected
  useEffect(() => {
    if (!isConnected) {
      if (summaryTimeoutRef.current) {
        clearTimeout(summaryTimeoutRef.current);
        summaryTimeoutRef.current = null;
      }
      if (diagramTimeoutRef.current) {
        clearTimeout(diagramTimeoutRef.current);
        diagramTimeoutRef.current = null;
      }
    }
  }, [isConnected]);

  // Function to add new transcript segment
  const addTranscriptSegment = (text: string) => {
    if (text.trim()) {
      const newSegment = {
        id: `segment-${segmentIdRef.current++}`,
        text: text.trim(),
        timestamp: new Date()
      };
      setTranscriptSegments(prev => [...prev, newSegment]);
      lastActivityRef.current = Date.now();
    }
  };

  // Function to clear all transcript segments
  const clearTranscripts = () => {
    setTranscriptSegments([]);
    setTranscript('');
    setSummary('');
    setDiagram('');
    setDiagramSvg('');
    setDiagramError('');
    setDiagramVersion(0);
  };

  // Function to handle connection errors gracefully
  const handleConnectionError = (error: unknown, isReconnect: boolean = false) => {
    console.error('Connection error:', error);
    
    // Check if it's a timeout/abort error
    const errorObj = error as { error?: { message?: string }; type?: string; message?: string };
    if (errorObj?.error?.message?.includes('User-Initiated Abort') || 
        errorObj?.error?.message?.includes('timeout') ||
        errorObj?.type === 'error') {
      
      if (isReconnect) {
        setError('Reconnection failed. Please try starting a new session.');
        setConnectionStatus('disconnected');
      } else {
        setError('Connection timed out. Attempting to reconnect...');
        setConnectionStatus('reconnecting');
        
        // Attempt to reconnect after a short delay
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        
        reconnectTimeoutRef.current = setTimeout(() => {
          if (sessionRef.current) {
            try {
              sessionRef.current.close();
            } catch (err) {
              console.error('Error closing session during reconnect:', err);
            }
            sessionRef.current = null;
          }
          setIsConnected(false);
          setIsListening(false);
          setTranscript('');
          
          // Try to reconnect
          setTimeout(() => {
            connectToSession(true);
          }, 1000);
        }, 2000);
      }
    } else {
      setError(`Connection error: ${errorObj?.error?.message || errorObj?.message || 'Unknown error'}`);
      setConnectionStatus('disconnected');
    }
  };

  // Function to attempt reconnection
  const attemptReconnect = () => {
    if (connectionStatus === 'reconnecting') return;
    
    setConnectionStatus('reconnecting');
    setError('Attempting to reconnect...');
    
    setTimeout(() => {
      connectToSession(true);
    }, 1000);
  };

  // Fetch available meeting types on component mount
  useEffect(() => {
    const fetchMeetingTypes = async () => {
      try {
        const response = await fetch('/api/summarize');
        if (response.ok) {
          const data = await response.json();
          setAvailableMeetingTypes(data.meetingTypes || []);
        }
      } catch (error) {
        console.error('Failed to fetch meeting types:', error);
      }
    };
    
    fetchMeetingTypes();
  }, []);

  useEffect(() => {
    // Initialize Mermaid
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: 'Arial, sans-serif',
      fontSize: 14,
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis'
      }
    });

    // Initialize the agent
    agentRef.current = new RealtimeAgent({
      name: 'Meeting Summary Assistant',
      instructions: `You are a helpful meeting summary assistant. You can help users:
      - Summarize meeting notes and discussions
      - Extract key action items and decisions
      - Organize meeting content by topics
      - Provide insights and recommendations based on meeting content
      
      Be conversational, helpful, and focus on making meeting information more accessible and actionable.`,
    });

    return () => {
      if (sessionRef.current) {
        // Close the session properly
        try {
          sessionRef.current.close();
        } catch (err) {
          console.error('Error closing session:', err);
        }
      }
      if (summaryTimeoutRef.current) {
        clearTimeout(summaryTimeoutRef.current);
        summaryTimeoutRef.current = null;
      }
      if (diagramTimeoutRef.current) {
        clearTimeout(diagramTimeoutRef.current);
        diagramTimeoutRef.current = null;
      }
    };
  }, []);

  const connectToSession = async (isReconnect: boolean = false) => {
    if (!agentRef.current) return;
    
    setIsConnecting(true);
    setError(null);
    
    try {
      // Get ephemeral token from our API
      const response = await fetch('/api/realtime-token', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to get realtime token');
      }
      
      const data = await response.json();
      console.log('Token response data:', data); // Debug log
      
      // Try different possible response structures
      let clientSecret = data.client_secret?.value;
      if (!clientSecret) {
        clientSecret = data.client_secret;
      }
      if (!clientSecret) {
        clientSecret = data.secret;
      }
      if (!clientSecret) {
        clientSecret = data.value;
      }
      
      if (!clientSecret) {
        console.error('Full response structure:', JSON.stringify(data, null, 2));
        throw new Error(`Invalid token response structure. Expected client_secret.value but got: ${JSON.stringify(data)}`);
      }

      // Create and connect to session
      const session = new RealtimeSession(agentRef.current, {
        model: 'gpt-realtime',
      });

      sessionRef.current = session;

      // Set up event listeners using the correct API
      session.on('transport_event', (event: TransportEvent) => {
        // Handle transcript delta events
        if (event.type === 'transcript_delta') {
          setTranscript(prev => prev + (event.delta || ''));
          lastActivityRef.current = Date.now();
        }
        // Handle completed transcription
        if (event.type === 'conversation.item.input_audio_transcription.completed') {
          const completedText = event.transcript || '';
          setTranscript(completedText);
          // Add the completed transcript as a new segment
          addTranscriptSegment(completedText);
          lastActivityRef.current = Date.now();
        }
        // Handle errors
        if (event.type === 'error') {
          console.error('Transport error:', event);
          // Handle empty error objects and provide meaningful error information
          if (!event.error || Object.keys(event.error).length === 0) {
            handleConnectionError({ 
              type: 'transport_error', 
              message: 'Transport layer error occurred - this may indicate a network or WebRTC issue' 
            }, false);
          } else {
            handleConnectionError(event, false);
          }
        }
      });

      session.on('audio_start', () => {
        setIsListening(false);
        lastActivityRef.current = Date.now();
      });

      session.on('audio_stopped', () => {
        setIsListening(true);
        lastActivityRef.current = Date.now();
      });

      session.on('error', (error: SessionError) => {
        console.error('Session error:', error);
        // Handle empty error objects and provide meaningful error information
        if (!error || Object.keys(error).length === 0) {
          handleConnectionError({ 
            type: 'session_error', 
            message: 'Session error occurred - this may indicate a connection or API issue' 
          }, false);
        } else {
          handleConnectionError(error, false);
        }
      });

      // Note: connection_state_change event is not available in this version
      // Connection state is managed through the existing error handlers

      // Connect to the session with timeout
      const connectionPromise = session.connect({ apiKey: clientSecret });
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout after 30 seconds')), 30000);
      });
      
      await Promise.race([connectionPromise, timeoutPromise]);
      
      setIsConnected(true);
      setIsListening(true);
      setConnectionStatus('connected');
      setError(null);
      lastActivityRef.current = Date.now();
    } catch (err) {
      console.error('Connection error:', err);
      
      // Handle specific WebRTC errors
      if (err instanceof Error) {
        if (err.message.includes('Failed to parse SessionDescription')) {
          setError('WebRTC connection failed. Please check your network connection and try again.');
        } else if (err.message.includes('timeout')) {
          setError('Connection timed out. Please try again.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to establish connection');
      }
      
      if (isReconnect) {
        handleConnectionError(err, true);
      } else {
        setConnectionStatus('disconnected');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    // Clear any pending timeouts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (sessionRef.current) {
      try {
        sessionRef.current.close();
        sessionRef.current = null;
      } catch (err) {
        console.error('Error closing session:', err);
      }
    }
    if (summaryTimeoutRef.current) {
      clearTimeout(summaryTimeoutRef.current);
      summaryTimeoutRef.current = null;
    }
    if (diagramTimeoutRef.current) {
      clearTimeout(diagramTimeoutRef.current);
      diagramTimeoutRef.current = null;
    }
    setIsConnected(false);
    setIsListening(false);
    setTranscript('');
    setConnectionStatus('disconnected');
    setError(null);
    // Don't clear transcriptSegments, summary, and diagram - keep them for the session
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (summaryTimeoutRef.current) {
        clearTimeout(summaryTimeoutRef.current);
        summaryTimeoutRef.current = null;
      }
      if (diagramTimeoutRef.current) {
        clearTimeout(diagramTimeoutRef.current);
        diagramTimeoutRef.current = null;
      }
    };
  }, []);

  return (
    <div className={`p-6 bg-white rounded-lg shadow-lg max-w-none w-full ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Voice Meeting Assistant
        </h2>
        
        {/* Meeting Type Selector */}
        {availableMeetingTypes.length > 0 && (
          <div className="flex items-center gap-3">
            <label htmlFor="meeting-type" className="text-sm font-medium text-gray-700">
              Meeting Type:
            </label>
            <select
              id="meeting-type"
              value={meetingType}
              onChange={(e) => setMeetingType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 transition-colors"
              style={{ color: '#111827' }}
            >
              {availableMeetingTypes.map((type) => (
                <option key={type.id} value={type.id} title={type.description}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      <div className="space-y-4">
        {!isConnected ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <button
                onClick={() => connectToSession()}
                disabled={isConnecting || connectionStatus === 'reconnecting'}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                {isConnecting ? 'Connecting...' : 
                 connectionStatus === 'reconnecting' ? 'Reconnecting...' : 'Start Voice Session'}
              </button>
              
              {connectionStatus === 'reconnecting' && (
                <button
                  onClick={() => attemptReconnect()}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Retry Connection
                </button>
              )}
            </div>
            
            {/* Show session data even when disconnected */}
            {(transcriptSegments.length > 0 || summary || diagram || diagramSvg) && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-700">Session Data</h3>
                  <button
                    onClick={clearTranscripts}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    Clear Session
                  </button>
                </div>
                
                {/* Two-column layout: diagram on left, transcript+summary on right */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Meeting Diagram - Takes up 2 columns (left side) */}
                  <div className="lg:col-span-2 bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-700 mb-4 flex items-center">
                      🏗️ System Architecture Diagram
                      {isGeneratingDiagram && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full animate-pulse">
                          Generating...
                        </span>
                      )}
                      {diagram && !isGeneratingDiagram && (
                        <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Building upon previous diagram (v{diagramVersion})
                        </span>
                      )}
                      {transcript.length > 0 && !diagram && !isGeneratingDiagram && !isGeneratingSummary && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                          ⏰ Both summary & diagram in ~3s
                        </span>
                      )}
                    </h3>
                    <div className="bg-white p-6 rounded border min-h-96 overflow-auto">
                      <div className="w-full h-full">
                        {diagramError ? (
                          <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-800 text-sm mb-2">Failed to render diagram</p>
                            <details className="mt-2">
                              <summary className="text-xs text-red-600 cursor-pointer">Show details</summary>
                              <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto whitespace-pre-wrap">
                                {diagramError}
                              </pre>
                            </details>
                          </div>
                        ) : diagramSvg ? (
                          <div dangerouslySetInnerHTML={{ __html: diagramSvg }} />
                        ) : isGeneratingDiagram ? (
                          <div className="text-center py-16">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-500 text-base">Generating system architecture diagram...</p>
                          </div>
                        ) : (
                          <div className="text-center py-16">
                            <div className="text-6xl mb-4">📊</div>
                            <p className="text-gray-500 text-base">
                              System architecture diagram will appear here as you discuss technical systems...
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right column: Transcript and Summary stacked */}
                  <div className="space-y-6">
                    {/* Transcript Segments List */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
                        📝 Transcript Segments
                        {transcriptSegments.length > 0 && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            {transcriptSegments.length} segments
                          </span>
                        )}
                      </h3>
                      <div className="bg-white rounded border max-h-64 overflow-y-auto">
                        {transcriptSegments.length === 0 ? (
                          <div className="p-4 text-center text-gray-500 text-sm">
                            No transcript segments yet...
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-100">
                            {transcriptSegments.map((segment, index) => (
                              <div key={segment.id} className="p-3 hover:bg-gray-50">
                                <div className="flex items-start justify-between mb-2">
                                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                    Segment {index + 1}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    {segment.timestamp.toLocaleTimeString()}
                                  </span>
                                </div>
                                <p className="text-gray-800 text-sm leading-relaxed">
                                  {segment.text}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Session Summary */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
                        🎯 Live Summary
                        {transcript.length > 0 && !summary && !isGeneratingSummary && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                              ⏰ Summary in ~3s
                            </span>
                            <button
                              onClick={() => {
                                const completeTranscript = getCompleteTranscript();
                                generateSummary(completeTranscript);
                              }}
                              disabled={getCompleteTranscript().length < 50}
                              className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded-full transition-colors disabled:opacity-50"
                            >
                              Generate Now
                            </button>
                          </div>
                        )}
                      </h3>
                      <div className="bg-white p-3 rounded border max-h-64 overflow-y-auto">
                        {isGeneratingSummary ? (
                          <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                            <p className="text-gray-500 text-xs">Generating summary...</p>
                          </div>
                        ) : summary ? (
                          <div className="space-y-3">
                            <div className="text-gray-800 text-sm leading-relaxed prose prose-sm max-w-none">
                              <ReactMarkdown>{summary}</ReactMarkdown>
                            </div>
                            
                            {/* Tech Stack & API Documentation */}
                            <TechStackLinks summary={summary} />
                            
                            {/* Documentation Links */}
                            <DocumentationLinks summary={summary} />
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">No summary generated yet...</p>
                        )}
                      </div>
                    </div>
                    
                    {/* API Documentation Container */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
                        🔗 API Documentation
                        {summary && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            {extractAPILinks(summary).length} APIs detected
                          </span>
                        )}
                      </h3>
                      <div className="bg-white p-3 rounded border max-h-64 overflow-y-auto">
                        {summary ? (
                          <APIDocumentationLinks summary={summary} />
                        ) : (
                          <p className="text-gray-500 text-sm">API documentation will appear here after summary generation...</p>
                        )}
                      </div>
                    </div>
                    
                    {/* MVP Generation Container */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
                        🚀 MVP Generation for Cursor
                        {summary && diagram && (
                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                            Ready to generate
                          </span>
                        )}
                      </h3>
                      <div className="bg-white p-3 rounded border max-h-64 overflow-y-auto">
                        {summary && diagram ? (
                          <MVPGenerationPrompt 
                            summary={summary} 
                            diagram={diagram} 
                            transcript={getCompleteTranscript()}
                            meetingType={meetingType}
                          />
                        ) : (
                          <p className="text-gray-500 text-sm">Complete the meeting to generate MVP prompt...</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">
                Status: {isListening ? 'Listening' : 'Processing'}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={clearTranscripts}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Clear All
                </button>
                <button
                  onClick={disconnect}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Disconnect
                </button>
              </div>
            </div>
            
            {/* Two-column layout: diagram on left, transcript+summary on right */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Live Meeting Diagram - Takes up 2 columns (left side) */}
              <div className="lg:col-span-2 bg-gray-50 p-6 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-700 flex items-center">
                    🏗️ System Architecture Diagram
                    {isGeneratingDiagram && (
                      <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full animate-pulse">
                        Generating...
                      </span>
                    )}
                    {diagram && !isGeneratingDiagram && (
                      <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        Version {diagramVersion}
                      </span>
                    )}
                  </h3>
                  <button
                    onClick={() => {
                      const completeTranscript = getCompleteTranscript();
                      generateDiagram(completeTranscript);
                    }}
                    disabled={
                      (!transcript && transcriptSegments.length === 0) || 
                      getCompleteTranscript().length < 100 || 
                      isGeneratingDiagram
                    }
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                  >
                    {isGeneratingDiagram ? 'Generating...' : 'Generate Diagram'}
                  </button>
                </div>
                <div className="bg-white p-6 rounded border min-h-96 overflow-auto">
                  <div className="w-full h-full">
                    {diagramError ? (
                      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-800 text-sm mb-2">Failed to render diagram</p>
                        <details className="mt-2">
                          <summary className="text-xs text-red-600 cursor-pointer">Show details</summary>
                          <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto whitespace-pre-wrap">
                            {diagramError}
                          </pre>
                        </details>
                      </div>
                    ) : diagramSvg ? (
                      <div dangerouslySetInnerHTML={{ __html: diagramSvg }} />
                    ) : isGeneratingDiagram ? (
                      <div className="text-center py-16">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                        <p className="text-gray-500 text-base">Generating system architecture diagram...</p>
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <div className="text-6xl mb-4">📊</div>
                        <p className="text-gray-500 text-base">
                          System architecture diagram will appear here as you discuss technical systems...
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right column: Transcript and Summary stacked */}
              <div className="space-y-6">
                {/* Transcript Segments List */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
                    📝 Transcript Segments
                    {transcriptSegments.length > 0 && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {transcriptSegments.length} segments
                      </span>
                    )}
                  </h3>
                  <div className="bg-white rounded border max-h-64 overflow-y-auto">
                    {transcriptSegments.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        Start speaking to see transcript segments...
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {transcriptSegments.map((segment, index) => (
                          <div key={segment.id} className="p-3 hover:bg-gray-50">
                            <div className="flex items-start justify-between mb-2">
                              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                Segment {index + 1}
                              </span>
                              <span className="text-xs text-gray-400">
                                {segment.timestamp.toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-gray-800 text-sm leading-relaxed">
                              {segment.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Real-time Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    🎯 Live Summary
                    {isGeneratingSummary && (
                      <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full animate-pulse">
                        Updating...
                      </span>
                    )}
                  </h3>
                  <div className="bg-white p-3 rounded border max-h-64 overflow-y-auto">
                    {summary ? (
                      <div className="text-gray-800 text-sm leading-relaxed prose prose-sm max-w-none">
                        <ReactMarkdown>{summary}</ReactMarkdown>
                      </div>
                    ) : transcriptSegments.length > 0 ? (
                      <div className="text-gray-500 text-sm">
                        {isGeneratingSummary ? 'Generating summary...' : 'Summary will appear here shortly...'}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">Summary will appear here as you speak...</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
              <p className="font-medium mb-1">💡 How it works:</p>
              <p>🎤 Speak naturally to interact with your meeting assistant</p>
              <p>📝 Each speech segment appears as a separate item in the transcript list</p>
              <p>🎯 AI-generated summaries update automatically after 3 seconds of silence</p>
              <p>🏗️ Click &quot;Generate Diagram&quot; to create system architecture diagrams from technical discussions</p>
              <p>🔄 Diagrams build upon previous versions for continuous evolution</p>
              <p>🗑️ Use &quot;Clear All&quot; to reset all session data</p>
              <p>💾 Your session data is preserved even after disconnecting</p>
              <p>🔄 Automatic reconnection handles timeout disconnections</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
            {connectionStatus === 'reconnecting' && (
              <button
                onClick={() => attemptReconnect()}
                className="mt-2 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-1 px-3 rounded text-xs transition-colors"
              >
                Retry Now
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
