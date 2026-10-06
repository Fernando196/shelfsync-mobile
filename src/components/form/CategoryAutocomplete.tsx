import { useEffect, useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { CirclePlus } from 'lucide-react-native';
import { ICategory } from '../../interfaces/category.interface';
import { getCategories, refreshCategories } from '../../lib/categoryCatalog';
import { createCategory } from '../../services/categories.service';

export default function CategoryAutocomplete({
  label,
  selected,
  onChange,
}: {
  label: string;
  selected: string;
  onChange: (id: string) => void;
}) {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [query, setQuery] = useState<string>('');
  const [isLoadingAddCat, setIsLoadingAddCat] = useState<boolean>(false);

  useEffect(() => {
    getCategories()
      .then((cat) => setCategories(cat))
      .catch((err) => {
        console.log('Error al cargar categorias');
      });
  }, []);

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(query.trim().toLocaleLowerCase()),
  );
  const text = query.trim();
  const exists = categories.some(
    (c) => c.name.trim().toLocaleLowerCase() === text.toLocaleLowerCase(),
  );

  const handleCreate = async () => {
    setIsLoadingAddCat(true);
    try {
      const newCategoryResponse = await createCategory({
        name: text.trim(),
        active: true,
      });

      onChange(newCategoryResponse.id);
      setQuery('');
      const updated = await refreshCategories();
      setCategories(updated);
    } catch (e: any) {
      Alert.alert('No se pudo crear la categoria', e.message);
    } finally {
      setIsLoadingAddCat(false);
    }
  };

  return (
    <View className="flex-1">
      <View className="flex flex-row">
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={label}
          className="border border-slate-200 rounded-xl px-4 py-3 mb-4 text-base flex-1"
          placeholderTextColor="#94a3b8"
        />
        {text !== '' && !exists && (
          <Pressable
            onPress={() => {
              handleCreate();
            }}
            className="pt-3 ml-2"
            disabled={isLoadingAddCat}
          >
            <CirclePlus color="#4f46e5" />
          </Pressable>
        )}
      </View>
      {categories.length > 0 && (
        <View className="flex-row flex-wrap">
          {filtered.map((categorie, index) => (
            <Pressable
              key={categorie.id}
              onPress={() => {
                onChange(categorie.id);
              }}
              className={`px-4 py-2 rounded-full mr-2 mb-2 border active:scale-95 ${
                categorie.id === selected
                  ? 'bg-primary-600 border-primary-600'
                  : 'bg-white border-slate-200'
              }`}
            >
              <Text
                className={`text-sm font-medium ${categorie.id == selected ? 'text-white' : 'text-slate-600'}`}
              >
                {categorie.name}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
