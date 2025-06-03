import { View, Text, TouchableOpacity } from 'react-native';
import styles from './styles';

const EditButton = ({ enableProfileFields }) => {

  const toggleEditMode = () => {
    enableProfileFields();
  }

  return (
    <TouchableOpacity style={styles.editButton} onPress={toggleEditMode}>
      <Text style={styles.editText}>Edit</Text>
    </TouchableOpacity>
  );
};

export default EditButton;
