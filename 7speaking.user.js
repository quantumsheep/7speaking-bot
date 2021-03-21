// ==UserScript==
// @name         7Speaking Bot
// @namespace    https://github.com/quantumsheep
// @version      1.2
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

  async function completeQuiz() {
    function getReactElement(e) {
      for (const key in e) {
        if (key.startsWith('__reactInternalInstance$')) {
          return e[key];
        }
      }

      return null;
    }

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

    if (!answer) {
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

  async function routes() {
    console.log(`Analysing current route`);

    if (isPath(/^\/home/)) {
      console.log(`Current route is /home`);

      console.log(`Selecting the first content...`);

      const e = await waitForQuerySelector('.scrollableList .scrollableList__content .MuiButtonBase-root');
      e.click();

      routes();
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
