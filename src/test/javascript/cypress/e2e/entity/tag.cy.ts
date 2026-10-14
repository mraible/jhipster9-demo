import {
  entityConfirmDeleteButtonSelector,
  entityCreateButtonSelector,
  entityCreateCancelButtonSelector,
  entityCreateSaveButtonSelector,
  entityDeleteButtonSelector,
  entityDetailsBackButtonSelector,
  entityDetailsButtonSelector,
  entityEditButtonSelector,
  entityTableSelector,
} from '../../support/entity';

describe('Tag e2e test', () => {
  const tagPageUrl = '/tag';
  let username: string;
  let password: string;
  const tagSample = { name: 'exaggerate oh' };

  let tag;

  before(() => {
    cy.credentials().then(credentials => {
      ({ username, password } = credentials);
    });
  });

  beforeEach(() => {
    cy.login(username, password);
  });

  beforeEach(() => {
    cy.intercept('GET', '/api/tags+(?*|)').as('entitiesRequest');
    cy.intercept('POST', '/api/tags').as('postEntityRequest');
    cy.intercept('DELETE', '/api/tags/*').as('deleteEntityRequest');
  });

  afterEach(() => {
    if (tag) {
      cy.authenticatedRequest({
        method: 'DELETE',
        url: `/api/tags/${tag.id}`,
      }).then(() => {
        tag = undefined;
      });
    }
  });

  it('Tags menu should load Tags page', () => {
    cy.visit('/');
    cy.clickOnEntityMenuItem('tag');
    cy.wait('@entitiesRequest').then(({ response }) => {
      if (response?.body.length === 0) {
        cy.get(entityTableSelector).should('not.exist');
      } else {
        cy.get(entityTableSelector).should('exist');
      }
    });
    cy.getEntityHeading('Tag').should('exist');
    cy.location('pathname').should('eq', tagPageUrl);
  });

  describe('Tag page', () => {
    it('should have translated page title', () => {
      cy.visit(tagPageUrl);
      cy.getEntityHeading('Tag').should('not.contain', 'blogApp.tag.home.title');
    });

    describe('create button click', () => {
      beforeEach(() => {
        cy.visit(tagPageUrl);
        cy.wait('@entitiesRequest');
      });

      it('should load create Tag page', () => {
        cy.get(entityCreateButtonSelector).click();
        cy.location('pathname').should('eq', `${tagPageUrl}/new`);
        cy.getEntityCreateUpdateHeading('Tag');
        cy.get(entityCreateSaveButtonSelector).should('exist');
        cy.get(entityCreateCancelButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response?.statusCode).to.equal(200);
        });
        cy.location('pathname').should('eq', tagPageUrl);
      });
    });

    describe('with existing value', () => {
      beforeEach(() => {
        cy.authenticatedRequest({
          method: 'POST',
          url: '/api/tags',
          body: tagSample,
        }).then(({ body }) => {
          tag = body;

          cy.intercept(
            {
              method: 'GET',
              url: '/api/tags+(?*|)',
              times: 1,
            },
            {
              statusCode: 200,
              headers: {
                link: '<http://localhost/api/tags?page=0&size=20>; rel="last",<http://localhost/api/tags?page=0&size=20>; rel="first"',
              },
              body: [tag],
            },
          ).as('entitiesRequestInternal');
        });

        cy.visit(tagPageUrl);

        cy.wait('@entitiesRequestInternal');
      });

      it('detail button click should load details Tag page', () => {
        cy.get(entityDetailsButtonSelector).first().click();
        cy.getEntityDetailsHeading('tag');
        cy.get(entityDetailsBackButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response?.statusCode).to.equal(200);
        });
        cy.location('pathname').should('eq', tagPageUrl);
      });

      it('edit button click should load edit Tag page and go back', () => {
        cy.get(entityEditButtonSelector).first().click();
        cy.getEntityCreateUpdateHeading('Tag');
        cy.get(entityCreateSaveButtonSelector).should('exist');
        cy.get(entityCreateCancelButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response?.statusCode).to.equal(200);
        });
        cy.location('pathname').should('eq', tagPageUrl);
      });

      it('edit button click should load edit Tag page and save', () => {
        cy.get(entityEditButtonSelector).first().click();
        cy.getEntityCreateUpdateHeading('Tag');
        cy.get(entityCreateSaveButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response?.statusCode).to.equal(200);
        });
        cy.location('pathname').should('eq', tagPageUrl);
      });

      it('last delete button click should delete instance of Tag', () => {
        cy.get(entityDeleteButtonSelector).last().click();
        cy.getEntityDeleteDialogHeading('tag').should('exist');
        cy.get(entityConfirmDeleteButtonSelector).click();
        cy.wait('@deleteEntityRequest').then(({ response }) => {
          expect(response?.statusCode).to.equal(204);
        });
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response?.statusCode).to.equal(200);
        });
        cy.location('pathname').should('eq', tagPageUrl);

        tag = undefined;
      });
    });
  });

  describe('new Tag page', () => {
    beforeEach(() => {
      cy.visit(tagPageUrl);
      cy.get(entityCreateButtonSelector).click();
      cy.getEntityCreateUpdateHeading('Tag');
    });

    it('should create an instance of Tag', () => {
      cy.get(`[data-cy="name"]`).type('an gah');
      cy.get(`[data-cy="name"]`).should('have.value', 'an gah');

      cy.get(entityCreateSaveButtonSelector).click();

      cy.wait('@postEntityRequest').then(({ response }) => {
        expect(response?.statusCode).to.equal(201);
        tag = response.body;
      });
      cy.wait('@entitiesRequest').then(({ response }) => {
        expect(response?.statusCode).to.equal(200);
      });
      cy.location('pathname').should('eq', tagPageUrl);
    });
  });
});
