### Task 1: Install Dependencies

**Files:**

- Modify: `package.json`
- Modify: `babel.config.js`

**Interfaces:** None — this is setup only.

- [ ] **Step 1: Install expo-haptics**

Run: `npx expo install expo-haptics`

Expected: `expo-haptics` added to `package.json` dependencies.

- [ ] **Step 2: Install bottom-sheet and gesture handler**

Run: `npx expo install @gorhom/bottom-sheet react-native-gesture-handler react-native-reanimated`

Expected: All three packages added to `package.json` dependencies.

- [ ] **Step 3: Add reanimated plugin to babel.config.js**

Edit `babel.config.js` — add `react-native-reanimated/plugin` as the **last** plugin in the array:

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
```

- [ ] **Step 4: Verify installation**

Run: `npm run typecheck`

Expected: Passes (no new type errors from installed packages).

- [ ] **Step 5: Commit**

```bash
git add package.json babel.config.js package-lock.json
git commit -m "chore: install expo-haptics, bottom-sheet, gesture-handler, reanimated"
```
