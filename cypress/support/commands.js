Cypress.Commands.add('login', (username, password) => {
  cy.session('login', () => {
    cy.visit(Cypress.env('baseUrl'));  
    cy.wait(3000);
    cy.get('#email').type(username);
    cy.get('#password').type(password);
    cy.intercept('/login').as('submitLogin');
    cy.get('#loginBtn').click();
    cy.wait(3000);
  }) 
    cacheAcrossSpecs: true
  });