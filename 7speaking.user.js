// ==UserScript==
// @name         7Speaking Bot
// @namespace    https://github.com/quantumsheep
// @version      3.1
// @description  7Speaking is kil
// @author       quantumsheep
// @match        https://user.7speaking.com/*
// @grant        none
// ==/UserScript==

(async () => {
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

  function isPath(regex) {
    return regex.test(location.pathname);
  }

  function error(message) {
    alert(message);
    throw new Error(message);
  }

  async function waitForQuerySelector(selector) {
    console.log(`Waiting for querySelector('${selector}')`)

    return new Promise(resolve => {
      const interval = setInterval(() => {
        const e = document.querySelector(selector);

        if (e) {
          clearInterval(interval);
          resolve(e);
        }
      }, 1000);
    });
  }

  function getReactElement(e) {
    for (const key in e) {
      if (key.startsWith('__reactInternalInstance$')) {
        return e[key];
      }
    }

    return null;
  }

  async function completeQuiz() {
    async function findAnswer() {
      const e = await waitForQuerySelector('.question-container');
      let container = getReactElement(e);

      while (container) {
        if (container.memoizedProps && container.memoizedProps.answerOptions && container.memoizedProps.answerOptions.answer) {
          return container.memoizedProps.answerOptions.answer[0];
        }

        container = container.return;
      }

      return null;
    }

    function getInputElement(answer) {
      const e = document.querySelector('.question__form input');

      if (e) {
        return {
          element: getReactElement(e),
          type: 'input'
        };
      }

      const buttons = document.querySelectorAll('.answer-container button');

      for (const button of buttons) {
        if (button.querySelector('.question__customLabel').innerText === answer) {
          return {
            element: button,
            type: 'button'
          };
        }
      }

      return null;
    }

    function getSubmitButton() {
      const e = document.querySelector('.question__form button[type=submit]');
      return e;
    }

    console.log('Searching for the answer...');

    const answer = await findAnswer();

    if (answer === null || answer === undefined) {
      return error("Can't find answer");
    }

    console.log(`Answer is "${answer}"`);

    const input = getInputElement(answer);

    if (!input) {
      return error("Can't find input");
    }

    console.log(`Question type is "${input.type}"`);

    if (input.type === 'input') {
      input.element.memoizedProps.onChange({
        currentTarget: {
          value: answer
        }
      });
    } else if (input.type === 'button') {
      input.element.click();
    }

    await wait(200);

    const button = getSubmitButton();

    if (!button) {
      return error("Can't find submit button");
    }

    console.log(`Clicking "Validate" button`);

    button.click();

    await wait(500);

    console.log(`Clicking "Next" button`);

    button.click();

    await wait(500);
  }

  async function completeExam() {
    async function findAnswer() {
      const e = await waitForQuerySelector('.question_content');
      let container = getReactElement(e);

      while (container) {
        if (container.memoizedProps && container.memoizedProps.questions) {
          return container.memoizedProps.questions[0].answer;
        }

        container = container.return;
      }

      return null;
    }

    const answer = await findAnswer();

    if (answer === null || answer === undefined) {
      const submitButton = document.querySelector('.buttons_container button:last-child');

      if (!submitButton) {
        return error("Can't find answer");
      } else {
        submitButton.click();
        await wait(1000);
      }
    } else {
      const inputs = document.querySelectorAll('.question_variant .radioButtons.choice_variant label');

      if (isNaN(answer)) {
        inputs[answer.charCodeAt(0) - 'A'.charCodeAt(0)].click();
      } else {
        inputs[+answer - 1].click();
      }

      const submitButton = await waitForQuerySelector('.buttons_container button:last-child');

      submitButton.click();

      await wait(1000);

      submitButton.click();

      await wait(1000);
    }
  }

  async function routes() {
    console.log(`Analysing current route`);

    if (isPath(/^\/home/)) {
      console.log(`Current route is /home`);

      console.log(`Selecting the first content...`);

      const e = await waitForQuerySelector('.scrollableList .scrollableList__content .MuiButtonBase-root');
      e.click();

      routes();
    } else if (isPath(/^\/workshop\/exams-tests/)) {
      const search = new URLSearchParams(location.search);

      if (search.has('id')) {
        await completeExam();
        routes();
      } else {
        const nextExam = await waitForQuerySelector('.lists .list__items.active');
        nextExam.click();

        await wait(300);

        const modalConfirmButton = document.querySelector('.confirmCloseDialog__buttons button:last-child');

        if (modalConfirmButton) {
          modalConfirmButton.click();
        }

        await wait(1000);

        routes();
      }
    } else if (isPath(/^\/workshop/)) {
      console.log(`Current route is /workshop`);

      await waitForQuerySelector('.category-action-content');

      const buttons = document.querySelectorAll('.bottom-pagination .pagination button');

      if (buttons.length > 0) {
        buttons[buttons.length - 1].click();
      }

      const quizButton = document.querySelector('.category-action-bottom button');

      if (!quizButton) {
        console.log("Can't find quiz button, returning to /home");
        location.href = '/home';
        throw new Error();
      }

      quizButton.click();

      routes();
    } else if (isPath(/^\/document\/\d+/)) {
      console.log(`Current route is /document`);

      const e = await waitForQuerySelector('.appBarTabs__testTab');
      e.click();

      routes();
    } else if (isPath(/^\/quiz/)) {
      console.log(`Current route is /quiz`);

      await waitForQuerySelector('.quiz__container');

      if (document.querySelector('.result-container')) {
        location.href = '/home';
      } else {
        await completeQuiz();
        routes();
      }
    }
  }

  if (document.readyState === 'complete') {
    routes();
  } else {
    window.addEventListener('load', async () => {
      routes();
    });
  }
})();
