describe('Blog co-authors e2e test', () => {
  let username: string;
  let password: string;
  let adminUsername: string;
  let adminPassword: string;
  let blog;

  const coAuthorsSelector = '[data-cy="coAuthors"]';
  const coAuthorLoginSelector = '[data-cy="coAuthorLogin"]';
  const addCoAuthorSelector = '[data-cy="addCoAuthor"]';

  before(() => {
    cy.credentials().then(credentials => {
      ({ username, password, adminUsername, adminPassword } = credentials);
    });
  });

  beforeEach(() => {
    cy.login(username, password);
    cy.authenticatedRequest({
      method: 'POST',
      url: '/api/blogs',
      body: { name: 'Shared blog', handle: 'shared' },
    }).then(({ body }) => {
      blog = body;
    });
    cy.intercept('GET', '/api/blogs/*/co-authors').as('coAuthorsRequest');
  });

  afterEach(() => {
    if (blog) {
      cy.login(username, password);
      cy.authenticatedRequest({ method: 'DELETE', url: `/api/blogs/${blog.id}` }).then(() => {
        blog = undefined;
      });
    }
  });

  it('owner can add and remove a co-author who can view but not manage the blog', () => {
    cy.visit(`/blog/${blog.id}/view`);
    cy.wait('@coAuthorsRequest');
    cy.get(coAuthorsSelector).should('contain', 'None');

    cy.get(coAuthorLoginSelector).type(adminUsername);
    cy.get(addCoAuthorSelector).click();
    cy.wait('@coAuthorsRequest');
    cy.get(coAuthorsSelector).should('contain', adminUsername);

    cy.login(adminUsername, adminPassword);
    cy.visit(`/blog/${blog.id}/view`);
    cy.wait('@coAuthorsRequest');
    cy.get('[data-cy="blogDetailsHeading"]').should('exist');
    cy.get(coAuthorsSelector).should('contain', adminUsername);
    cy.get(coAuthorLoginSelector).should('not.exist');

    cy.login(username, password);
    cy.visit(`/blog/${blog.id}/view`);
    cy.wait('@coAuthorsRequest');
    cy.get(`button[aria-label="Remove ${adminUsername}"]`).click();
    cy.wait('@coAuthorsRequest');
    cy.get(coAuthorsSelector).should('contain', 'None').and('not.contain', adminUsername);
  });
});
