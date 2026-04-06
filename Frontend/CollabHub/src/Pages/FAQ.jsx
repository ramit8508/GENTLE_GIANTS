import React, { useState } from 'react';

const faqData = [
  {
    question: "What is CollabHub?",
    answer: "CollabHub is a platform designed to connect developers, designers, and creators to collaborate on exciting projects. Whether you're looking to join a team or find members for your own project, CollabHub is the place for you."
  },
  {
    question: "How do I create a project?",
    answer: "Once you're signed in, click on the 'Create' link in the navigation bar. Fill in your project details, including title, description, and the roles you're looking for, then hit 'Post Project'."
  },
  {
    question: "How can I join a project?",
    answer: "Browse through the 'Explore' page to find projects that interest you. Click on a project to see its details, and if you find a role that fits your skills, click the 'Join Project' button to send a request to the project creator."
  },
  {
    question: "Can I manage my own projects?",
    answer: "Yes! Navigate to 'My Projects' to see all the projects you've created. From there, you can view details, manage join requests, and update project information."
  },
  {
    question: "Is CollabHub free to use?",
    answer: "Absolutely. CollabHub is a community-driven platform and is free for all users to explore, create, and join projects."
  },
  {
    question: "What should I do if I find a bug?",
    answer: "We're constantly improving! If you encounter any issues, please feel free to reach out through our contact channels or report it on our GitHub repository."
  }
];

export default function FAQ() {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleAccordion = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="page faq-page fade-in">
      <div className="page-header">
        <h1>Frequently Asked Questions</h1>
        <p>Your questions, answered.</p>
      </div>

      <div className="section">
        <div className="auth-card auth-card-wide stagger-children">
          {faqData.map((item, index) => (
            <div 
              key={index} 
              className={`faq-item ${activeIndex === index ? 'active' : ''}`}
              onClick={() => toggleAccordion(index)}
              style={{ 
                borderBottom: index !== faqData.length - 1 ? '1px solid var(--border)' : 'none', 
                marginBottom: '20px',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                backgroundColor: activeIndex === index ? 'rgba(0,0,0,0.03)' : 'transparent',
                padding: '24px',
                margin: '0 -24px 20px -24px',
                cursor: 'pointer',
                borderRadius: '4px'
              }}
              onMouseEnter={(e) => !activeIndex === index && (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.01)')}
              onMouseLeave={(e) => activeIndex !== index && (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <div 
                className="faq-question"
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <h4 style={{ 
                  color: activeIndex === index ? 'var(--text)' : 'var(--text-muted)', 
                  transition: 'color 0.4s cubic-bezier(0.16, 1, 0.3, 1)', 
                  marginBottom: 0,
                  fontSize: '1rem',
                  fontWeight: activeIndex === index ? '600' : '500'
                }}>
                  {item.question}
                </h4>
                <div style={{ 
                  fontSize: '1.5rem', 
                  transform: activeIndex === index ? 'rotate(45deg)' : 'rotate(0)', 
                  transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                  lineHeight: 1,
                  color: activeIndex === index ? 'var(--accent-red)' : 'var(--text-muted)'
                }}>
                  +
                </div>
              </div>

              <div 
                style={{ 
                  display: 'grid',
                  gridTemplateRows: activeIndex === index ? '1fr' : '0fr',
                  transition: 'grid-template-rows 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                  overflow: 'hidden'
                }}
              >
                <div style={{ minHeight: 0 }}>
                  <div className="faq-answer" style={{ 
                    paddingTop: '16px', 
                    color: 'var(--text-secondary)', 
                    fontSize: '0.9375rem', 
                    lineHeight: '1.7',
                    opacity: activeIndex === index ? 1 : 0,
                    transform: activeIndex === index ? 'translateY(0)' : 'translateY(10px)',
                    transition: 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    transitionDelay: activeIndex === index ? '0.1s' : '0s'
                  }}>
                    {item.answer}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
