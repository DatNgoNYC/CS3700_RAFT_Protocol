let index = 0;

const logEvery75ms = () => {
  console.log(index);
  setTimeout(logEvery75ms, 75);
  index += 1;
};

setTimeout(logEvery75ms, 75);
