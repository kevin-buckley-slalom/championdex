import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { SearchHeader } from '../SearchHeader';

describe('SearchHeader', () => {
  it('renders correctly with title and placeholder', () => {
    const mockOnChangeText = jest.fn();
    render(
      <SearchHeader
        title="Test Title"
        value=""
        onChangeText={mockOnChangeText}
        placeholder="Test placeholder"
      />
    );

    const titleText = screen.getByText('Test Title');
    expect(titleText).toBeDefined();

    const textInput = screen.getByPlaceholderText('Test placeholder');
    expect(textInput).toBeDefined();
  });

  it('renders with default placeholder when not provided', () => {
    const mockOnChangeText = jest.fn();
    render(
      <SearchHeader
        title="Test Title"
        value=""
        onChangeText={mockOnChangeText}
      />
    );

    const textInput = screen.getByPlaceholderText('Search...');
    expect(textInput).toBeDefined();
  });

  it('calls onChangeText with typed text', () => {
    const mockOnChangeText = jest.fn();
    render(
      <SearchHeader
        title="Test Title"
        value=""
        onChangeText={mockOnChangeText}
      />
    );

    const textInput = screen.getByPlaceholderText('Search...');
    fireEvent.changeText(textInput, 'test query');

    expect(mockOnChangeText).toHaveBeenCalledWith('test query');
    expect(mockOnChangeText).toHaveBeenCalledTimes(1);
  });

  it('displays the value prop passed from parent', () => {
    const mockOnChangeText = jest.fn();
    render(
      <SearchHeader
        title="Test Title"
        value="bulbasaur"
        onChangeText={mockOnChangeText}
      />
    );

    const textInput = screen.getByPlaceholderText('Search...');
    expect(textInput.props.value).toBe('bulbasaur');
  });

  it('updates display when value prop changes', () => {
    const mockOnChangeText = jest.fn();
    const { rerender } = render(
      <SearchHeader
        title="Test Title"
        value="p"
        onChangeText={mockOnChangeText}
      />
    );

    const textInput = screen.getByPlaceholderText('Search...');
    expect(textInput.props.value).toBe('p');

    rerender(
      <SearchHeader
        title="Test Title"
        value="po"
        onChangeText={mockOnChangeText}
      />
    );

    expect(textInput.props.value).toBe('po');

    rerender(
      <SearchHeader
        title="Test Title"
        value="pok"
        onChangeText={mockOnChangeText}
      />
    );

    expect(textInput.props.value).toBe('pok');
  });

  it('handles multiple text changes without clearing between keystrokes', () => {
    const mockOnChangeText = jest.fn();
    const { rerender } = render(
      <SearchHeader
        title="Test Title"
        value=""
        onChangeText={mockOnChangeText}
      />
    );

    const textInput = screen.getByPlaceholderText('Search...');

    // Simulate typing 'a' and parent updates value prop
    fireEvent.changeText(textInput, 'a');
    expect(mockOnChangeText).toHaveBeenCalledWith('a');

    rerender(
      <SearchHeader
        title="Test Title"
        value="a"
        onChangeText={mockOnChangeText}
      />
    );
    expect(textInput.props.value).toBe('a');

    // Type 'b'
    fireEvent.changeText(textInput, 'ab');
    expect(mockOnChangeText).toHaveBeenCalledWith('ab');

    rerender(
      <SearchHeader
        title="Test Title"
        value="ab"
        onChangeText={mockOnChangeText}
      />
    );
    expect(textInput.props.value).toBe('ab');

    // Type 'c'
    fireEvent.changeText(textInput, 'abc');
    expect(mockOnChangeText).toHaveBeenCalledWith('abc');

    // Callback should be called for each change
    expect(mockOnChangeText).toHaveBeenCalledTimes(3);
  });

  it('clears value when text is set to empty string', () => {
    const mockOnChangeText = jest.fn();
    const { rerender } = render(
      <SearchHeader
        title="Test Title"
        value="test"
        onChangeText={mockOnChangeText}
      />
    );

    const textInput = screen.getByPlaceholderText('Search...');
    expect(textInput.props.value).toBe('test');

    // User clears the input
    fireEvent.changeText(textInput, '');
    expect(mockOnChangeText).toHaveBeenCalledWith('');

    // Parent updates the value prop
    rerender(
      <SearchHeader
        title="Test Title"
        value=""
        onChangeText={mockOnChangeText}
      />
    );

    expect(textInput.props.value).toBe('');
  });

  it('renders search icon', () => {
    const mockOnChangeText = jest.fn();
    render(
      <SearchHeader
        title="Test Title"
        value=""
        onChangeText={mockOnChangeText}
      />
    );

    const searchIcon = screen.getByText('⌕');
    expect(searchIcon).toBeDefined();
  });

  it('is a pure controlled component receiving all state from parent', () => {
    const mockOnChangeText = jest.fn();
    const { rerender } = render(
      <SearchHeader
        title="Moves"
        value=""
        onChangeText={mockOnChangeText}
        placeholder="Search moves..."
      />
    );

    const textInput = screen.getByPlaceholderText('Search moves...');

    // User types
    fireEvent.changeText(textInput, 'tackle');
    expect(mockOnChangeText).toHaveBeenCalledWith('tackle');

    // Parent updates the value prop (simulating state update with debounce)
    rerender(
      <SearchHeader
        title="Moves"
        value="tackle"
        onChangeText={mockOnChangeText}
        placeholder="Search moves..."
      />
    );

    expect(textInput.props.value).toBe('tackle');

    // User types more
    fireEvent.changeText(textInput, 'tackled');
    expect(mockOnChangeText).toHaveBeenNthCalledWith(2, 'tackled');

    // Parent updates again
    rerender(
      <SearchHeader
        title="Moves"
        value="tackled"
        onChangeText={mockOnChangeText}
        placeholder="Search moves..."
      />
    );

    expect(textInput.props.value).toBe('tackled');
  });
});
